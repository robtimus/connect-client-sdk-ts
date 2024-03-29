/**
 * @group unit:crypto
 */

import * as crypto from "crypto";
import { expect } from "@jest/globals";
import { MatcherFunction } from "expect";
import { getRandomValues, isAvailable, randomUUID } from "../../../../../src/ext/impl/crypto/native-crypto-browser";
import { Mocks, maxNode, minNode } from "../../../test-util";

const toBeUUID: MatcherFunction<[]> = function (actual: unknown) {
  const expected = crypto.randomUUID().replace(/[a-z0-9]/gi, "x");
  if (typeof actual === "string" && actual.replace(/[a-z0-9]/gi, "x") === expected) {
    return {
      message: () => `expected ${this.utils.printReceived(actual)} not to be a UUID`,
      pass: true,
    };
  }
  return {
    message: () => `expected ${this.utils.printReceived(actual)} to be a UUID`,
    pass: false,
  };
};

const toHaveRandomValues: MatcherFunction<[]> = function (actual: unknown) {
  const array = actual as Uint8Array;
  const allZeroes = array.every((n) => n === 0);
  if (allZeroes) {
    return {
      message: () => `expected ${this.utils.printReceived(actual)} to have random values`,
      pass: false,
    };
  }
  return {
    message: () => `expected ${this.utils.printReceived(actual)} to have only 0 values`,
    pass: true,
  };
};

expect.extend({
  toBeUUID,
  toHaveRandomValues,
});

declare module "expect" {
  interface AsymmetricMatchers {
    toBeUUID(): void;
    toHaveRandomValues(): void;
  }

  interface Matchers<R> {
    toBeUUID(): R;
    toHaveRandomValues(): R;
  }
}

describe("native crypto", () => {
  const globalMocks = Mocks.global();

  afterEach(() => globalMocks.restore());

  // Node.js 20 has added crypto in the global namespace including randomUUID and subtle

  describe("randomUUID", () => {
    maxNode(18).test("crypto not defined", () => {
      expect(() => randomUUID()).toThrow(new Error("Neither crypto.randomUUID nor crypto.getRandomValues is available"));
    });

    maxNode(18).test("crypto.randomUUID and crypto.getRandomValues not defined", () => {
      globalMocks.mock("crypto", {});

      expect(() => randomUUID()).toThrow(new Error("Neither crypto.randomUUID nor crypto.getRandomValues is available"));
    });

    maxNode(18).test("crypto.randomUUID not defined", () => {
      globalMocks.mock("crypto", {
        getRandomValues: crypto.webcrypto.getRandomValues.bind(crypto.webcrypto),
      });

      expect(randomUUID()).toBeUUID();
    });

    // crypto.webcrypto.randomUUID was added in Node.js 16.7
    minNode(16, 7).test("crypto.randomUUID defined", () => {
      globalMocks.mock("crypto", crypto.webcrypto);

      expect(randomUUID()).toBeUUID();
    });
  });

  describe("getRandomValues", () => {
    maxNode(18).test("crypto not defined", () => {
      expect(() => getRandomValues(new Uint8Array(16))).toThrow(new Error("crypto.getRandomValues is not available"));
    });

    maxNode(18).test("crypto.getRandomValues not defined", () => {
      globalMocks.mock("crypto", {});

      expect(() => getRandomValues(new Uint8Array(16))).toThrow(new Error("crypto.getRandomValues is not available"));
    });

    test("crypto.getRandomValues defined", () => {
      globalMocks.mock("crypto", crypto.webcrypto);

      const array = new Uint8Array(16);
      const result = getRandomValues(array);
      expect(result).toBe(array);
      expect(result).toHaveRandomValues();
    });
  });

  describe("isAvailable", () => {
    maxNode(18).test("crypto not defined", () => {
      expect(isAvailable()).toBe(false);
    });

    maxNode(18).test("crypto.getRandomValues not defined", () => {
      globalMocks.mock("crypto", {
        subtle: crypto.webcrypto.subtle,
      });

      expect(isAvailable()).toBe(false);
    });

    maxNode(18).test("crypto.subtle not defined", () => {
      globalMocks.mock("crypto", {
        getRandomValues: crypto.webcrypto.getRandomValues.bind(crypto.webcrypto),
      });

      expect(isAvailable()).toBe(false);
    });

    test("crypto, crypto.getRandomValues and crypto.suble defined", () => {
      globalMocks.mock("crypto", crypto.webcrypto);

      expect(isAvailable()).toBe(true);
    });
  });
});

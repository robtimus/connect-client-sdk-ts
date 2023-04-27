/**
 * @group unit:module
 */

import { PaymentRequest } from "../../src/model";
import { Session } from "../../src/Session";

test("module can be loaded", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require("../../src");
  // Only PaymentRequest and Session are actually included, the rest are interfaces
  expect(Object.keys(module)).toStrictEqual(["PaymentRequest", "Session"]);
  expect(module).toHaveProperty("PaymentRequest", PaymentRequest);
  expect(module).toHaveProperty("Session", Session);
});

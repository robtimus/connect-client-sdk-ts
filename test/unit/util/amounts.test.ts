/**
 * @group unit:util
 */

import { formatAmount } from "../../../src/util/amounts";

describe("formatAmount", () => {
  test.each([
    [0, "0.00"],
    [10, "0.10"],
    [25, "0.25"],
    [100, "1.00"],
    [1000, "10.00"],
  ])("%d => %s", (amount, expected) => {
    expect(formatAmount(amount)).toBe(expected);
  });
});

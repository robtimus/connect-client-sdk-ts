/**
 * @group unit:module
 */

test("module can be loaded", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require("../../src");
  expect(module).toHaveProperty("Session");
  expect(module).toHaveProperty("browser");
  expect(module).toHaveProperty("isSubtleCryptoAvailable");
  expect(module).toHaveProperty("subtleCryptoEngine");
  expect(module).not.toHaveProperty("forceCryptoEngine");
  expect(module).toHaveProperty("isFetchAvailable");
  expect(module).toHaveProperty("fetchHttpClient");
  expect(module).toHaveProperty("xhrHttpClient");
});

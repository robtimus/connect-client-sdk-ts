/**
 * @group selenium
 */

import { Server } from "http";
import { AddressInfo } from "net";
import { Builder, By, WebDriver, WebElement } from "selenium-webdriver";
import * as express from "express";
import { createPaymentWithEncryptedCustomerInput, getSessionDetails } from "../s2s-api-util";
import { until } from "selenium-webdriver";
import { SessionDetails } from "../../src/model";

describe("session", () => {
  const app = express();
  let server: Server;
  let baseUrl: string;

  let driver: WebDriver;

  let sessionDetails: SessionDetails;

  app.use(express.static("test/selenium"));
  app.use("/lib", express.static("lib"));

  jest.setTimeout(60 * 1000 * 10);

  beforeAll(() => {
    server = app.listen();
    const address = server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  beforeAll(async () => {
    const browser = process.env.SELENIUM_BROWSER ?? "chrome";
    driver = await new Builder().forBrowser(browser).build();
  });

  beforeAll(async () => {
    sessionDetails = await getSessionDetails();
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  afterAll(async () => {
    await driver.quit();
  });

  async function setText(element: WebElement, value: string) {
    await element.clear();
    await element.sendKeys(value);
  }

  test("in-browser", async () => {
    await driver.get(baseUrl);

    // Fill in details, then click start
    await setText(driver.findElement(By.id("assetUrl")), sessionDetails.assetUrl);
    await setText(driver.findElement(By.id("clientApiUrl")), sessionDetails.clientApiUrl);
    await setText(driver.findElement(By.id("clientSessionId")), sessionDetails.clientSessionId);
    await setText(driver.findElement(By.id("customerId")), sessionDetails.customerId);
    await driver.findElement(By.id("start")).click();

    // Await until the product details become visible
    await driver.wait(until.elementIsVisible(driver.findElement(By.id("payment-product"))));

    // Fill in required fields that are already there
    await setText(driver.findElement(By.id("payment-product-field-cardNumber")), "4242424242424242");
    await setText(driver.findElement(By.id("payment-product-field-expiryDate")), "1230");
    await setText(driver.findElement(By.id("payment-product-field-cvv")), "123");
    // Check that the CVV tooltip is correctly set; the size comes from the test page
    const cvvTooltipUrl = await driver.findElement(By.id("payment-product-field-cvv-tooltip")).getAttribute("src");
    expect(cvvTooltipUrl).toMatch(
      new RegExp(`${sessionDetails.assetUrl}templates/master/global/css/img/ppimages/ppf_cvv_v\\d+\\.png\\?size=240x160`)
    );

    // Wait until the product logo becomes available, after the IIN details call
    const cardLogo = await driver.findElement(By.id("payment-product-field-cardNumber-logo"));
    await driver.wait(until.elementIsVisible(cardLogo));
    // Check that the product logo is correctly set; the size comes from the test page
    const cardLogoUrl = await cardLogo.getAttribute("src");
    expect(cardLogoUrl).toMatch(
      new RegExp(`${sessionDetails.assetUrl}templates/master/global/css/img/ppimages/pp_logo_\\d+_v\\d+\\.png\\?size=37x37`)
    );

    // The cardholder name may not be available, depending on the available product(s)
    const cardholderName = await driver.findElement(By.id("payment-product-field-cardholderName")).catch(() => undefined);
    if (cardholderName) {
      await setText(cardholderName, "John Doe");
    }

    // Encrypt
    const encryptButton = await driver.findElement(By.id("encrypt"));
    await driver.wait(until.elementIsEnabled(encryptButton));
    await encryptButton.click();

    // Wait for encryption to finish, then retrieve and validate the encrypted payload
    const encryptedPayloadElement = await driver.findElement(By.id("encrypted-payload"));
    await driver.wait(until.elementIsVisible(encryptedPayloadElement));
    const encryptedPayload = await encryptedPayloadElement.getAttribute("value");
    const encodedHeader = encryptedPayload.split(".")[0];
    const header = JSON.parse(atob(encodedHeader));
    expect(header).toHaveProperty("alg", "RSA-OAEP");
    expect(header).toHaveProperty("enc", "A256CBC-HS512");
    expect(header).toHaveProperty("kid");

    // A 402 response is allowed; that means that the encryption / decryption mechanism works
    try {
      const createPaymentResult = await createPaymentWithEncryptedCustomerInput(encryptedPayload, {
        amount: 1000,
        currencyCode: "EUR",
      });
      expect(createPaymentResult.payment?.id).toBeTruthy();
    } catch (reason) {
      expect(reason).toHaveProperty("status", 402);
    }

    driver.close();
  });
});

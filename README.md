# Worldline Connect client SDK
[![npm](https://img.shields.io/npm/v/@robtimus/connect-client-sdk)](https://www.npmjs.com/package/@robtimus/connect-client-sdk)
[![Build Status](https://github.com/robtimus/connect-client-sdk-ts/actions/workflows/build.yml/badge.svg)](https://github.com/robtimus/connect-client-sdk-ts/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=robtimus%3Aconnect-client-sdk&metric=alert_status)](https://sonarcloud.io/summary/overall?id=robtimus%3Aconnect-client-sdk)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=robtimus%3Aconnect-client-sdk&metric=coverage)](https://sonarcloud.io/summary/overall?id=robtimus%3Aconnect-client-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/robtimus/connect-client-sdk-ts/badge.svg)](https://snyk.io/test/github/robtimus/connect-client-sdk-ts)

An SDK for the [Worldline Connect](https://epayments.developer-ingenico.com/) Client API. It's based on the [official SDK](https://github.com/Ingenico-ePayments/connect-sdk-client-js), but is mostly written from scratch, and provides some improvements:

* No hard requirement on browser specifics. Although this is the default, with only a little work it's possible to use the SDK in React Native apps.
* No custom code for functionality most modern browsers support like Base64 encoding/decoding.
* Proper promises.
* HTTP calls use the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) if available, with [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) available as fallback.
* Native cryptography if available, through the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). [node-forge](https://www.npmjs.com/package/node-forge) can still be used as fallback.
* No deprecated legacy code.
* More support for creating Apple Pay and Google Pay payments.

## Installation

Install this SDK using your preferred Node.js package manager like `npm`, `yarn` or `pnpm`. For instance:

    npm i @robtimus/connect-client-sdk

## Packaging

The SDK's default packaging is as separate ES modules. This can be used by most bundlers, but also in non-browser environments.
The default export contains the most important types:

```typescript
import { PaymentContext, PaymentRequest, Session, SessionDetails } from "@robtimus/connect-client-sdk";
```

### Usage Universal Module Definition (UMD)

The SDK is available under global namespace `connectClientSdk`, and can be imported in the following way:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    ...
    <script src="./node_modules/@robtimus/connect-client-sdk/lib/connect-client-sdk.umd.js"></script>
  </head>
  <body>
    <script>
      const session = new connectClientSdk.Session({
        ...
      }, {
        ...
      })
    </script>
  </body>
</html>
```

## Getting started

1. Use the Worldline Connect Server APi's [Create session](https://epayments-api.developer-ingenico.com/s2sapi/v1/en_US/json/sessions/create.html) call to create a session.

2. Create a [SessionDetails](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.SessionDetails.html) object using the Create session response:

```typescript
const sessionDetails: SessionDetails = {
  assetUrl: "https://payment.pay1.secured-by-ingenico.com/",
  clientApiUrl: "https://eu.api-ingenico.com/client",
  clientSessionId: "f084372052fb47d9a766ec35bfa0e6bd",
  customerId: "9991-0b67467b30df4c6d8649c8adc568fd0f",
};
```

> In JavaScript, the session response can be used as-is. In TypeScript you need to either remove the `invalidTokens` and `region` properties (if present), or cast the response to `SessionDetails`.

3. Create a [PaymentContext](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentContext.html) object with the necessary values (more properties can be added as necessary):

```typescript
const paymentContext: PaymentContext = {
  amountOfMoney: {
    amount: 1000,
    currencyCode: "EUR",
  },
  countryCode: "NL",
};
```

4. Create a [Session](https://robtimus.github.io/connect-client-sdk-ts/classes/Session.Session.html) object with the created `SessionDetails` and `PaymentContext` objects:

```typescript
const session = new Session(sessionDetails, paymentContext);
```

> Unlike the official SDK, this SDK requires the payment context to be specified up front. It can be updated using `session.updatePaymentContext`. This accepts a partial `PaymentContext` that will be merged into the session's payment context. This allows you to only specify the changes you want to make.

5. Use the `Session` object to retrieve the available payment products, payment product groups, and their accounts on file. Display these, and let your customer select one:

```typescript
const paymentItems = await session.getBasicPaymentItems();
// Display the contents of paymentItems.paymentItems (the payment products and payment product groups) and paymentItems.accountsOnFile
```

6. When a payment product or payment product group is selected, use the `Session` object to retrieve more information about the payment product or payment product group. This contains the fields for the product. Display these fields and let your customer fill them in:

```typescript
const paymentProduct = await session.getPaymentProduct(1);
// or const paymentProductGroup = await session.getPaymentProductGroup("cards");
// Display the contents of paymentProduct.fields or paymentProductGroup.fields
```

7. Create an instance of [PaymentRequest](https://robtimus.github.io/connect-client-sdk-ts/classes/model.PaymentRequest.html), set its payment product, and store the value entered for each field:

```typescript
const paymentRequest = new PaymentRequest();
paymentRequest.setPaymentProduct(paymentProduct);
paymentRequest.setValue("cardNumber", "4567 3500 0042 7977");
paymentRequest.setValue("cvv", "123");
paymentRequest.setValue("expiryDate", "12/99");
paymentRequest.setValue("cardholderName", "Wile E. Coyote");
```

> The values can be masked (as shown above), as long as the mask matches the field's mask. The SDK will automatically remove these masks when needed.

8. Validate the `PaymentRequest` object:

```typescript
const result = paymentRequest.validate();
if (!result.valid) {
  // result.errors contains each validation error, e.g. { fieldId: "cardNumber", ruleId: "luhn" } or { fieldId: "cvv", ruleId: "required" }
  // These can be be used to display error messages to your customer
}
```

9. Encrypt the contents of the `PaymentRequest` object:

```typescript
const encryptor = await session.getEncryptor();
const payload = encryptor.encrypt(paymentRequest);
```

10. Send the payload to your server, where it can be used for the `encryptedCustomerInput` property of a [Create payment](https://epayments-api.developer-ingenico.com/s2sapi/v1/en_US/json/payments/create.html) call.

## Extended usage

### IIN details

When using the `cards` payment product group, it's important to know which payment product a card belongs to. This can be done by retrieving the [IIN details](https://epayments-api.developer-ingenico.com/c2sapi/v1/en_US/json/services/getIINdetails.html), and checking the status property:

```typescript
const iinDetails = await session.getIINDetails("4567 35");
switch (iinDetails.status) {
  case "SUPPORTED":
    // The card is known and allowed within the current payment context.
    // iinDetails.isAllowedInContext is true, iinDetails.paymentProductId and iinDetails.countryCode are available.
    // If the card has multiple brands, iinDetails.coBrands contains the paymentProductId for each of them,
    // and an isAllowedInContext flag that determines whether or not the co-brand is allowed for the current context.
    break;
  case "NOT_ALLOWED":
    // The card is known but not allowed within the current payment context.
    // Like SUPPORTED, but iinDetails.isAllowedInContext is false.
    break;
  case "NOT_ENOUGH_DIGITS":
    // Fewever than 6 digits were provided. No additional properties are available.
    break;
  case "UNKNOWN":
    // The card is not known.
    // iinDetails.errorId and iinDetails.errors come from the Worldline Connect Client API error response.
    break
}
```

### Payment product specifics

#### Apple Pay

if Apple Pay (302) is one of your available payment products, you need to provide some more information in the `PaymentContext` to be able to use it:

```typescript
const paymentContext: PaymentContext = {
  ...
  paymentProductSpecificInputs: {
    applePay: {
      merchantName: "Your name",
      merchantCountryCode: "Your optional 2-letter ISO country code;\
                            the acquirer country as returned by the Worldline Connect Client API will be used if available,\
                            otherwise this value if specified, otherwise the country code from the payment context",
      lineItem: "Optional line item; if not set the merchant name will be used",
    }
  }
};
```

You can then use the following code to set a `PaymentRequest`'s value for Apple Pay's `encryptedPaymentData` field:

```typescript
const applePayProduct = await session.getPaymentProduct(302);
// or const applePayProduct = paymentProducts.getPaymentProduct(302);
// or const applePayProduct = paymentItems.getPaymentItem(302);
const applePayHelper = await session.ApplePay(applePayProduct);
const paymentData = await applePayHelper.createPayment();

paymentRequest.setValue("encryptedPaymentData", JSON.stringify(paymentData.paymentData));
```

> If the browser does not support Apple Pay, the SDK will filter it out of the available payment products.

#### Google Pay

If Google Pay (320) is one of your available payment products, you need to provide some more information in the `PaymentContext` to be able to use it:

```typescript
const paymentContext: PaymentContext = {
  ...
  paymentProductSpecificInputs: {
    googlePay: {
      connectMerchantId: "Your Connect merchant id",
      googlePayMerchantId: "Your Google Pay merchant id",
      transactionCountryCode: "ISO 3166-1 alpha-2 country code for the country where the transaction will be completed/processed;\
                               the acquirer country as returned by the Worldline Connect Client API will be used if available,\
                               otherwise this value if specified, otherwise the country code from the payment context",
      merchantName: "Your optional user visible merchant name; if not set the Business name in your Google Pay Developer Profile will be used",
      environment: "PRODUCTION", // or "TEST" for test purposes
    }
  }
};
```

You can then use the following code to set a `PaymentRequest`'s value for Google Pay's `encryptedPaymentData` field:

```typescript
const googlePayProduct = await session.getPaymentProduct(320);
// or const googlePayProduct = paymentProducts.getPaymentProduct(320);
// or const googlePayProduct = paymentItems.getPaymentItem(320);
const googlePayHelper = await session.GooglePay(googlePayProduct);
const paymentData = await googlePayHelper.createPayment();

paymentRequest.setValue("encryptedPaymentData", paymentData.paymentMethodData.tokenizationData.token);
```

> The `googlePayHelper` can be used before initializing the payment for two purposes:
> 1. `googlePayHelper.prefetchPaymentData()` prefetches configuration to improve `createPayment` execution time on later user interaction.
> 2. `googlePayHelper.createButton({ ... })` creates a button that you can add to your page (see https://developers.google.com/pay/api/web/guides/tutorial#add-button). Note that the `allowedPaymentMethods` will be set for you, you only need to provide the `onClick` handler and display properties.

> You need to load an additional JavaScript file (see https://developers.google.com/pay/api/web/guides/tutorial#js-load). If you don't, the SDK will filter Google Pay out of the available payment products.

#### Bancontact

By default, retrieving the Bancontact (3012) product will not return the fields of the basic flow. You can force these fields to be returned by providing some more information in the `PaymentContext`:

```typescript
const paymentContext: PaymentContext = {
  ...
  paymentProductSpecificInputs: {
    bancontact: {
      forceBasicFlow: true,
    }
  }
};
```

See the details of the `forceBasicFlow` query parameter of the [Get payment product](https://epayments-api.developer-ingenico.com/c2sapi/v1/en_US/javascript/products/get.html) call for more information.

### Masking field values

To help in formatting field values like credit cards or expiry dates, [PaymentProductField](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductField.html) provides functions `applyMask`, `applyWildcardMask` and `removeMask` to apply and remove masks. For example:

```typescript
const cardNumberField = paymentProduct.getField("cardNumber");
const value = "4567350000427977";

const maskedValue = cardNumberField.applyMask(value).formattedValue; // 4567 3500 0042 7977

const unmaksedValue = cardNumberField.removeMask(maskedValue); // 4567350000427977
```

### Accounts on file (tokens)

Accounts on file are available from instances of [BasicPaymentItem](https://robtimus.github.io/connect-client-sdk-ts/types/model.BasicPaymentItem.html) / [PaymentItem](https://robtimus.github.io/connect-client-sdk-ts/types/model.PaymentItem.html), [BasicPaymentProduct](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProduct.html) / [PaymentProduct](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProduct.html) and [BasicPaymentProductGroup](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProductGroup.html) / [PaymentProductGroup](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductGroup.html). They are also available from instances of [BasicPaymentItems](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentItems.html), [BasicPaymentProducts](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProducts.html) and [BasicPaymentProductGroups](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProductGroups.html); these contain the accounts on file of each of their elements.

An account on file can be rendered in the list of available accounts on file using the label template elements of its display hints in combination with the account on file attributes:

```typescript
const accountOnFile = ...;
const displayValue = accountOnFile.displayHints.labelTemplate
  .map((e) => accountOnFile.getAttributeDisplayValue(e.attributeKey))
  .join(" ");
```

To render an account on file's detail page, fetch its matching payment product and display it mostly as usual. However, some fields should not be editable. [AccountOnFile](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.AccountOnFile.html) has method `isReadOnlyAttribute` that can be used. For instance:

```typescript
const paymentProduct = await session.getPaymentProduct(accountOnFile.paymentProductId);
for (const field of paymentProduct.fields) {
  if (accountOnFile.isReadOnlyAttribute(field.id)) {
    // render accountOnFile.getAttributeDisplayValue(field.id) as text or a disabled input element
  } else {
    const attribute = accountOnFile.findAttribute(field.id);
    if (attribute) {
      // render field with attribute.value as initial value
    } else {
      // render field as usual
    }
  }
}
```

When creating a `PaymentRequest`, make sure to set not only the payment product but also the account on file:

```typescript
const paymentRequest = new PaymentRequest();
paymentRequest.setPaymentProduct(paymentProduct);
paymentRequest.setAccountOnFile(accountOnFile);
// Read-only fields like the cardNumber should not be set
// The cvv is usually not stored in an account on file
// The expiryDate is usually editable because it changes every time a new card is issued
paymentRequest.setValue("cvv", "123");
paymentRequest.setValue("expiryDate", "12/99");
```

### Server-side rendering support

In case you perform server-side rendering, and the payment product or payment product group is already available, it's possible to set this on a `Session` object:

```typescript
session.setProvidedPaymentItem({
  id: 1,
  ...
});
```

Whenever this payment product or payment product group is retrieved, the Worldline Connect Client API will not be queried, but the provided value will be returned instead.

> The value should be provided as returned by the Worldline Connect Client API or the Worldline Connect Server API. The SDK will convert this as necessary.

### Non-browser support

The official SDK cannot be used outside of browsers, because it relies on browser mechanics like [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) and `window`.\
By default this SDK also doesn't work outside of browsers. However, it's possible to replace the browser specifics with a custom implementation of [Device](https://robtimus.github.io/connect-client-sdk-ts/interfaces/ext.Device.html). This consists of:

* An [HttpClient](https://robtimus.github.io/connect-client-sdk-ts/interfaces/ext_http.HttpClient.html). [fetchHttpClient](https://robtimus.github.io/connect-client-sdk-ts/variables/ext_impl_http_fetch.fetchHttpClient.html) can be used, or a custom implementation can be created.
* [DeviceInformation](https://robtimus.github.io/connect-client-sdk-ts/interfaces/ext.DeviceInformation.html) that describes some device-specifics. This is used for metadata that's sent to the Worldline Connect Client API, as well as encrypted customer input.
* Optionally, an [ApplePayClient](https://robtimus.github.io/connect-client-sdk-ts/interfaces/ext.ApplePayClient.html) and [GooglePayClient](https://robtimus.github.io/connect-client-sdk-ts/interfaces/ext.GooglePayClient.html). If either one is not available, the matching payment product will be filtered out.

When you've created a custom `Device`, provide it when creating a `Session` object:

```typescript
const device = ...;
const session = new Session(sessionDetails, paymentContext, device);
```

## API

The API can be found [here](https://robtimus.github.io/connect-client-sdk-ts/modules/index.html).

### Differences from the Worldline Connect Client API

`Session` objects expose all endpoints of the Worldline Connect Client API. Most of the requests and responses are identical and unmodified. The following differences exist:

* [AccountOnFile](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.AccountOnFile.html) has some attribute related utility methods.
* [AccountOnFileDisplayHints](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.AccountOnFileDisplayHints.html) has some label template related utility methods. Logos are resolved against the asset URL.
* [LabelTemplateElement](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.LabelTemplateElement.html) adds property `wildcardMask` which is like the `mask` but using `*` instead of numbers.
* [BasicPaymentProduct](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProduct.html) is a representation of payment products without any field information. It also has some account on file related utility methods. [PaymentProduct](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProduct.html) extends it to add the missing field information, as well as field related utility methods.
* [BasicPaymentProducts](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProducts.html) is a collection of `BasicPaymentProduct` objects and their `AccountOnFile` objects. It has some payment product and account on file related utility methods.
* [BasicPaymentProductGroup](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProductGroup.html) is a representation of payment product groups without any field information. It also has some account on file related utility methods. [PaymentProductGroup](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProduct.html) extends it to add the missing field information, as well as field related utility methods.
* [BasicPaymentProductGroups](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentProductGroups.html) is a collection of `BasicPaymentProductGroup` objects and their `AccountOnFile` objects. It has some payment product group and account on file related utility methods.
* [BasicPaymentItem](https://robtimus.github.io/connect-client-sdk-ts/types/model.BasicPaymentItem.html) is a union type that combines both `BasicPaymentProduct` and `BasicPaymentProductGroup`. The common `type` attribute can be used to determine whether a `BasicPaymentItem` is a `BasicPaymentProduct` or a `BasicPaymentProductGroup`.
* [PaymentItem](https://robtimus.github.io/connect-client-sdk-ts/types/model.PaymentItem.html) is a union type that combines both `PaymentProduct` and `PaymentProductGroup`. The common `type` attribute can be used to determine whether a `PaymentItem` is a `PaymentProduct` or a `PaymentProductGroup`.
* [BasicPaymentItems](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.BasicPaymentItems.html) is a collection of `BasicPaymentItem` objects and their `AccountOnFile` objects. It has some payment item and account on file related utility methods.
* [PaymentProductDisplayHints](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductDisplayHints.html) logos are resolved against the asset URL.
* [PaymentProductField](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductField.html) adds property `inputType` which can be used as the `type` attribute of an HTML `input` element. The official SDK used the `type` property for this information, thereby losing the original type. In addition, `PaymentProductField` adds some masking and validation related utility methods.
* [PaymentProductFieldDataRestrictions](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductFieldDataRestrictions.html) replaces the `validators` object with `validationRules` which can be used to actually validate values for the field. It also adds some validation rule related methods.
* [PaymentProductFieldDisplayHints](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductFieldDisplayHints.html) adds property `wildcardMask` which is like the `mask` but using `*` instead of numbers.
* [PaymentProductFieldTooltip](https://robtimus.github.io/connect-client-sdk-ts/interfaces/model.PaymentProductFieldTooltip.html) images are resolved against the asset URL.
* [IINDetailsResult](https://robtimus.github.io/connect-client-sdk-ts/types/model.IINDetailsResult.html) combines an IIN details success response with input validation and an IIN-not-found response. It adds a `status` property to make the distinction.
* Integration of [Create session for payment product](https://epayments-api.developer-ingenico.com/c2sapi/v1/en_US/javascript/products/sessions.html) inside `Session` is split for each separate payment product. Currently only method `createApplePaySession` exists.

## Requirements

### Browsers

The following are the minimum supported browsers:

| Browser             | Min version |
|---------------------|-------------|
| Chrome              | 74+         |
| Edge                | 79+         |
| Safari              | 14.1+       |
| Firefox             | 90+         |
| Opera               | 62+         |
| Chrome for Android  | 113+        |
| Safari on iOS       | 14.5+       |
| Opera Mobile        | 73+         |
| Android Browser     | 113+        |
| Firefox for Android | 113+        |

Internet Explorer and older versions of these browser can become supported by using a polyfill like [core-js](https://www.npmjs.com/package/core-js).

If the Web Crypto API is not available, it's possible to use [node-forge](https://www.npmjs.com/package/node-forge) instead. For instance:

```typescript
import { forgeCryptoEngine } from "@robtimus/connect-client-sdk/lib/ext/impl/crypto/forge";
import { webCryptoCryptoEngine } from "@robtimus/connect-client-sdk/lib/ext/impl/crypto/WebCrypto";

Session.defaultCryptoEngine = webCryptoCryptoEngine ?? forgeCryptoEngine;

// create session as usual
```

When using UMD, this is done automatically when using `connect-client-sdk.forge.umd.js` instead of `connect-client-sdk.umd.js`:

```html
<script src="./node_modules/@robtimus/connect-client-sdk/lib/connect-client-sdk.forge.umd.js"></script>
```

### Node.js

Node.js 16 or higher is required.

## Building the repository

From the root of the project install all dependencies, then compile the code:

```
npm ci
npm run build
# optional:
npm run typedoc
```

## Testing

There are three types of tests:

1. Unit tests. These will work out-of-the-box.\
   Run these tests as follows:

    ```
    npm run test
    ```
2. Integration tests. Before you can run these, you first need to copy file `test/config.json.dist` to `test/config.json` and replace all values as needed.\
   Run these tests as follows:

    ```
    npm run test:integration
    ```
3. Selenium (in-browser) tests. Before you can run these, you first need to copy file `test/config.json.dist` to `test/config.json` and replace all values as needed.\
   Run these tests as follows:

    ```
    npm run test:selenium
    ```

You can also run all these types of tests together as follows:

    npm run test:all

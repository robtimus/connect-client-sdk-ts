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

## Initialization

Install this SDK using your preferred Node.js package manager like `npm`, `yarn` or `pnpm`. For instance:

    npm i @robtimus/connect-client-sdk

## Usage

TODO

## Requirements

### Browsers

The following are the minimum supported browsers:

| Browser             | Default  | Web API Cryptography |
|---------------------|----------|----------------------|
| Chrome              | 69+      | 37+                  |
| Edge                | 79+      | 12+                  |
| Safari              | 12+      | 7+                   |
| Firefox             | 62+      | 34+                  |
| Opera               | 56+      | 24+                  |
| Chrome for Android  | 112+     | 112+                 |
| Safari on iOS       | 12+      | 7+                   |
| Opera Mobile        | 73+      | 73+                  |
| Android Browser     | 112+     | 4.4+                 |
| Firefox for Android | 110+     | 110+                 |

Internet Explorer and older versions of these browser can become supported by using a polyfill like [core-js](https://www.npmjs.com/package/core-js).

If the Web Crypto API is not available, it's possible to use [node-forge](https://www.npmjs.com/package/node-forge) instead. For instance:

```
import { forgeCryptoEngine } from "@robtimus/connect-client-sdk/lib/ext/impl/crypto/forge";
import { isWebCryptoAvailable, webCryptoCryptoEngine } from "@robtimus/connect-client-sdk/lib/ext/impl/crypto/WebCrypto";

// create session as usual

session.setCryptoEngine(isWebCryptoAvailable() ? webCryptoCryptoEngine : forgeCryptoEngine);
```

### Node.js

Node.js 16 or higher is required.

## Building the repository

From the root of the project install all dependencies, then compile the code:

    npm ci
    npm run build

## Testing

There are two types of tests:

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

You can also run both types of tests together as follows:

    npm run test:all

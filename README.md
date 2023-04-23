# Ingenico Connect client SDK
[![npm](https://img.shields.io/npm/v/@robtimus/connect-client-sdk)](https://www.npmjs.com/package/@robtimus/connect-client-sdk)
[![Build Status](https://github.com/robtimus/connect-client-sdk-ts/actions/workflows/build.yml/badge.svg)](https://github.com/robtimus/connect-client-sdk-ts/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=robtimus%3Aconnect-client-sdk&metric=alert_status)](https://sonarcloud.io/summary/overall?id=robtimus%3Aconnect-client-sdk)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=robtimus%3Aconnect-client-sdk&metric=coverage)](https://sonarcloud.io/summary/overall?id=robtimus%3Aconnect-client-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/robtimus/connect-client-sdk-ts/badge.svg)](https://snyk.io/test/github/robtimus/connect-client-sdk-ts)

An SDK for the [Ingenico Connect](https://epayments.developer-ingenico.com/) Client API. It's based on the [official SDK](https://github.com/Ingenico-ePayments/connect-sdk-client-js), but provides some improvements:

* No explicit requirement on browser specifics. This makes it usable for React Native apps.
* No deprecated legacy code.
* Native cryptography if available, through [web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API). [node-forge](https://www.npmjs.com/package/node-forge) can still be used as fallback.
* TODO...

## Initialization

TODO

## Usage

TODO

## Requirements

Node.js 16 or higher is required.

## Installation

From the folder where your `package.json` is located, run the following command to install the SDK:

    npm i @robtimus/connect-client-sdk

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

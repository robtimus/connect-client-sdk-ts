import { Session } from "./Session";
import { forgeCryptoEngine } from "./ext/impl/crypto/forge";
import { webCryptoCryptoEngine } from "./ext/impl/crypto/WebCrypto";

export * from ".";

Session.defaultCryptoEngine = webCryptoCryptoEngine ?? forgeCryptoEngine;

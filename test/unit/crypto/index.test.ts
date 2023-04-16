/**
 * @group unit:validation
 */

import { v4 as uuidv4 } from "uuid";
import { JWE, JWK } from "node-jose";
import { JOSEEncryptor } from "../../../src/crypto";
import { forgeEncryptor } from "../../../src/crypto/forge";

function testJOSEEncryptor(joseEncryptor: JOSEEncryptor): void {
  describe("encrypt", () => {
    const payload = {
      clientSessionId: uuidv4(),
      paymentValues: [
        {
          key: "cardNumber",
          value: "4242424242424242",
        },
        {
          key: "expirationDate",
          value: "1230",
        },
        {
          key: "cvv",
          value: "123",
        },
      ],
    };
    test("can be decrypted", async () => {
      const keyId = "test-key";
      // Note: this key pair has been generated explicitly for this test. It is not used anywhere else.
      const publicKey =
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxLdEYd0b95r1qBB5B114lGXQ3n3yaT0mq89u6niNEiOjmduUgEZ39YN3WTA0shRFuECD/q1bO300BBFRDYUisH8T+dQl1FojbUPNaBtZXtil/0gX12zbw84qwkhzpDV7D6yZxbNq451wPLQFfG9spXhLOtHhH5AhQ/DemvS0NxkkFLdshYiTcC34UIYd3lAmd/tP8/jG1yGI7tj1gwX/qgNgr16toZONkpXBcym7avsxe5HSBFuVZjPUj6XKWmL34MG5NY0YK502eGPyJ7qdi8dKDeS3zO6lllvMxb4XhG+H9hb0Sl13obpvVRO5AN7jFaRzOlnvETxpULd+20XpIQIDAQAB";
      const privateKey =
        "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDEt0Rh3Rv3mvWoEHkHXXiUZdDeffJpPSarz27qeI0SI6OZ25SARnf1g3dZMDSyFEW4QIP+rVs7fTQEEVENhSKwfxP51CXUWiNtQ81oG1le2KX/SBfXbNvDzirCSHOkNXsPrJnFs2rjnXA8tAV8b2yleEs60eEfkCFD8N6a9LQ3GSQUt2yFiJNwLfhQhh3eUCZ3+0/z+MbXIYju2PWDBf+qA2CvXq2hk42SlcFzKbtq+zF7kdIEW5VmM9SPpcpaYvfgwbk1jRgrnTZ4Y/Inup2Lx0oN5LfM7qWWW8zFvheEb4f2FvRKXXehum9VE7kA3uMVpHM6We8RPGlQt37bRekhAgMBAAECggEAIaRWBYaS6d2OdZebmy7ZGEfxWJuhgW371xY6mc7UEW4W5JEw7F8g1NQO7SnZWTsuUTx3Vm6/U4UuCCQOAInsTNLuz6MAdTiVJnKaBlvnBNl4ShhCO41aaDoyBdfuLv8WdK/H/I+akCK0tyzyYz2LDyFrfDu4jHVRuxTOfSGsUF+nfsddInYJsE8wvYGICyWW6iTNJDSO+jBtf0tI+W9RdMmF4uWwoUV6evOXUx/qJCWstvDga7hPkY10CMgFwQI6TOsLiJok8Y0DXbk3Z5CZAiDGjDrDiO3JMMIty1xPwMcVJmIdTgDJ6R1JOz3yWOQgquXt5sTBY02A5lzC8sN7oQKBgQDqngyGuz+/7bL+yQ5X7TpSHVF9GnHh09pbM990nbQPqKQHqFpV4aePfs/3gZQBfl2CuZGoIONlb+N/EagnXom71NorLzF2UzgOjSfLICIs7bQEsuUk9cBv0WqDNN2Tjsfvr0/pFBZtQLTtVN49S3WunVd4NhiYgh3JUG4ZiSyggwKBgQDWpOxoNx35MGqBXtnFSWVzg9/tUnQARIZoweZ+aZuCpB0jwMSsYDdfdfDcPuVGWSjmkRW9bTqIisF/MbN7rIuu0X4cd+JbmAfaYVq7wFUALahcQ8MYsd/Fm8CITB+q8mRmFaQPC+2wbxwcwhnDi/eDbhmdt/9ex8pKwyBvYaqWiwKBgQCiQ3kKXcrzZORdDpTa/vlM/XX0fiuxMiJc3X14W/HCurHnkeoYZ57Jwbz3wyin98uYs9snWseqyj2fDokr4ViFDett3o/o9BlbBwk0lR7N0ACnF0sfys+zBjUSVafBfAiPnsI3w2rXWN9JHV8vKVdU0wFB5LgSEjujlfrvsk2pHQKBgQCXmBdXa0YCDo3KHQFU8wdx1Du80zUWU09SgU+XDGNGmz3xWF4PGE1DYHriMpGfY60dWm6uQIzMjqMmgCWxPSXSLCcTWCBIbFFvjL6WR7pAy/5SW5FYyZevatdJ6+mZxGPgLXyXG+edanvCW9vyXdJLwuDYoXD8scJPlww7XhErDQKBgDz4lEf159P5BzbZh/AyeWy0sLxjiH6ibptpvWpsBoLe5Wl28xOBYzV7EQ6vMDlSGbYIe42+CJulaFYv6yoUbLWHZ7KGC2uWu00V8yVoJfbeT4cNvdy5pPBuR5IvIVYS9cMm+c8Ne2dPusCjrSqFc7ipLRGSgW51srqL9qyCKe3Q";
      const encryptedPayload = await joseEncryptor.encrypt(JSON.stringify(payload), keyId, publicKey);

      const key = await JWK.asKey(atob(privateKey), "pkcs8");
      const decryptor = JWE.createDecrypt(key);
      const result = await decryptor.decrypt(encryptedPayload);
      expect(result.header).toStrictEqual({
        alg: "RSA-OAEP",
        enc: "A256CBC-HS512",
        kid: keyId,
      });
      const decryptedPayload = JSON.parse(result.plaintext.toString("utf-8"));
      expect(decryptedPayload).toStrictEqual(payload);
    });
  });
}

describe("forge", () => {
  testJOSEEncryptor(forgeEncryptor);
});

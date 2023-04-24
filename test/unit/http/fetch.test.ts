/**
 * @group unit:http
 */

import { Server } from "http";
import { AddressInfo } from "net";
import * as express from "express";
import * as bodyParser from "body-parser";
import { fetchHttpClient } from "../../../src/http/fetch";

describe("fetch HttpClient", () => {
  const app = express();
  let server: Server;
  let baseUrl: string;

  interface EchoResponse {
    url: string;
    method: string;
    contentType?: string;
    authorization?: string;
    body?: string;
  }

  const echoHandler = (req: express.Request, res: express.Response) => {
    const result: EchoResponse = {
      url: req.url,
      method: req.method,
    };
    const contentType = req.headers["content-type"];
    if (contentType) {
      result.contentType = contentType;
    }
    const authorization = req.headers.authorization;
    if (authorization) {
      result.authorization = authorization;
    }
    if (typeof req.body === "string") {
      result.body = req.body;
    }
    res.status(200).json(result);
  };

  app.use(
    bodyParser.text({
      type: "*/*",
    })
  );
  app.get("/echo", echoHandler);
  app.delete("/echo", echoHandler);
  app.post("/echo", echoHandler);
  app.put("/echo", echoHandler);
  app.get("/error", (req, res) => {
    res.status(500).type("txt").send(`Error: ${req.url}`);
  });
  app.get("/empty", (_req, res) => {
    res.status(204).send();
  });

  beforeAll(() => {
    server = app.listen();
    const address = server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  test("GET", async () => {
    const response = await fetchHttpClient
      .get(`${baseUrl}/echo`)
      .queryParam("name", "value")
      .queryParams("repeated", [1, 2])
      .header("Authorization", "Bearer token")
      .send();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toMatch(/application\/json.*/);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveProperty("url", `/echo?name=value&repeated=1&repeated=2`);
    expect(response.body).toHaveProperty("method", "GET");
    expect(response.body).not.toHaveProperty("contentType");
    expect(response.body).toHaveProperty("authorization", "Bearer token");
    expect(response.body).not.toHaveProperty("body");
  });

  test("DELETE", async () => {
    const response = await fetchHttpClient
      .delete(`${baseUrl}/echo`)
      .queryParam("name", "value")
      .queryParams("repeated", [1, 2])
      .header("Authorization", "Bearer token")
      .send();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toMatch(/application\/json.*/);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveProperty("url", `/echo?name=value&repeated=1&repeated=2`);
    expect(response.body).toHaveProperty("method", "DELETE");
    expect(response.body).not.toHaveProperty("contentType");
    expect(response.body).toHaveProperty("authorization", "Bearer token");
    expect(response.body).not.toHaveProperty("body");
  });

  describe("POST", () => {
    test("without body", async () => {
      const response = await fetchHttpClient
        .post(`${baseUrl}/echo`)
        .queryParam("name", "value")
        .queryParams("repeated", [1, 2])
        .header("Authorization", "Bearer token")
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url", `/echo?name=value&repeated=1&repeated=2`);
      expect(response.body).toHaveProperty("method", "POST");
      expect(response.body).not.toHaveProperty("contentType");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).not.toHaveProperty("body");
    });

    test("with body", async () => {
      const body = {
        key: "expirationDate",
        value: "1230",
      };
      const response = await fetchHttpClient
        .post(`${baseUrl}/echo`, body)
        .queryParam("name", "value")
        .queryParams("repeated", [1, 2])
        .header("Authorization", "Bearer token")
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url", `/echo?name=value&repeated=1&repeated=2`);
      expect(response.body).toHaveProperty("method", "POST");
      expect(response.body).toHaveProperty("contentType", "application/json");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).toHaveProperty("body", JSON.stringify(body));
    });
  });

  describe("PUT", () => {
    test("without body", async () => {
      const response = await fetchHttpClient
        .put(`${baseUrl}/echo`)
        .queryParam("name", "value")
        .queryParams("repeated", [1, 2])
        .header("Authorization", "Bearer token")
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url", `/echo?name=value&repeated=1&repeated=2`);
      expect(response.body).toHaveProperty("method", "PUT");
      expect(response.body).not.toHaveProperty("contentType");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).not.toHaveProperty("body");
    });

    test("with body", async () => {
      const body = {
        key: "expirationDate",
        value: "1230",
      };
      const response = await fetchHttpClient
        .put(`${baseUrl}/echo`, body)
        .queryParam("name", "value")
        .queryParams("repeated", [1, 2])
        .header("Authorization", "Bearer token")
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url", `/echo?name=value&repeated=1&repeated=2`);
      expect(response.body).toHaveProperty("method", "PUT");
      expect(response.body).toHaveProperty("contentType", "application/json");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).toHaveProperty("body", JSON.stringify(body));
    });
  });

  test("non-JSON response", async () => {
    const response = await fetchHttpClient.get(`${baseUrl}/error`).send();
    expect(response.statusCode).toBe(500);
    expect(response.contentType).toMatch(/text\/plain.*/);
    expect(response.body).toBe(`Error: /error`);
  });

  test("empty response", async () => {
    const response = await fetchHttpClient.get(`${baseUrl}/empty`).send();
    expect(response.statusCode).toBe(204);
    expect(response.contentType).toBeUndefined();
    expect(response.body).toBeFalsy();
  });
});

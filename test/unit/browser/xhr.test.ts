/**
 * @group unit:browser
 */

import { newServer } from "mock-xmlhttprequest";
import { RequestHandler } from "mock-xmlhttprequest/dist/types/MockXhrServer";
import MockXhrRequest from "mock-xmlhttprequest/dist/types/MockXhrRequest";
import { xhrHttpClient } from "../../../src/browser/xhr";

describe("xhrHttpRequest", () => {
  interface EchoResponse {
    url: string;
    method: string;
    contentType?: string;
    authorization?: string;
    body?: string;
  }

  const echoHandler: RequestHandler = (request: MockXhrRequest) => {
    const result: EchoResponse = {
      url: request.url,
      method: request.method,
    };
    const contentType = request.requestHeaders.getHeader("content-type");
    if (contentType) {
      result.contentType = contentType;
    }
    const authorization = request.requestHeaders.getHeader("authorization");
    if (authorization) {
      result.authorization = authorization;
    }
    if (request.body) {
      result.body = request.body;
    }
    request.respond(
      200,
      {
        "Content-Type": "application/json",
      },
      JSON.stringify(result)
    );
  };

  const echoUrlMatcher = new RegExp("/echo(\\?.*)?");
  const server = newServer({
    get: [echoUrlMatcher, echoHandler],
    delete: [echoUrlMatcher, echoHandler],
    post: [echoUrlMatcher, echoHandler],
    put: [echoUrlMatcher, echoHandler],
  });
  server.get(/\/error.*/, (request) => {
    request.respond(
      500,
      {
        "Content-Type": "text/plain",
      },
      `Error: ${request.url}`
    );
  });
  server.get(/\/empty.*/, {
    status: 204,
  });
  server.get(/\/xhrError.*/, "error");
  server.get(/\/timeout.*/, "timeout");
  server.get(/\/incorrectJson.*/, (request) => {
    request.respond(200, { "Content-Type": "application/jsonn" }, "Non-JSON");
  });

  const client = xhrHttpClient({
    timeout: 1000,
  });

  beforeAll(() => {
    server.install();

    if (typeof window === "undefined") {
      Object.defineProperty(globalThis, "window", {
        value: {
          location: "http://localhost",
        },
      });
    }
  });

  afterAll(() => server.remove());

  test("GET", async () => {
    const response = await client.get("/echo").queryParam("name", "value").queryParams("repeated", [1, 2]).header("Authorization", "Bearer token").send();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toMatch(/application\/json.*/);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveProperty("url");
    expect(response.body).toHaveProperty("method", "GET");
    expect(response.body).not.toHaveProperty("contentType");
    expect(response.body).toHaveProperty("authorization", "Bearer token");
    expect(response.body).not.toHaveProperty("body");
    const responseBody = response.body as EchoResponse;
    expect(responseBody.url).toMatch(new RegExp("/echo\\?name=value&repeated=1&repeated=2&cacheBust=\\d+"));
  });

  test("DELETE", async () => {
    const response = await client.delete("/echo").queryParam("name", "value").queryParams("repeated", [1, 2]).header("Authorization", "Bearer token").send();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toMatch(/application\/json.*/);
    expect(response.body).toBeTruthy();
    expect(response.body).toHaveProperty("url");
    expect(response.body).toHaveProperty("method", "DELETE");
    expect(response.body).not.toHaveProperty("contentType");
    expect(response.body).toHaveProperty("authorization", "Bearer token");
    expect(response.body).not.toHaveProperty("body");
    const responseBody = response.body as EchoResponse;
    expect(responseBody.url).toMatch(new RegExp("/echo\\?name=value&repeated=1&repeated=2&cacheBust=\\d+"));
  });

  describe("POST", () => {
    test("without body", async () => {
      const response = await client.post("/echo").queryParam("name", "value").queryParams("repeated", [1, 2]).header("Authorization", "Bearer token").send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("method", "POST");
      expect(response.body).not.toHaveProperty("contentType");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).not.toHaveProperty("body");
      const responseBody = response.body as EchoResponse;
      expect(responseBody.url).toMatch(new RegExp("/echo\\?name=value&repeated=1&repeated=2&cacheBust=\\d+"));
    });

    test("with body", async () => {
      const body = {
        key: "expirationDate",
        value: "1230",
      };
      const response = await client.post("/echo", body).queryParam("name", "value").queryParams("repeated", [1, 2]).header("Authorization", "Bearer token").send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("method", "POST");
      expect(response.body).toHaveProperty("contentType", "application/json");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).toHaveProperty("body", JSON.stringify(body));
      const responseBody = response.body as EchoResponse;
      expect(responseBody.url).toMatch(new RegExp("/echo\\?name=value&repeated=1&repeated=2&cacheBust=\\d+"));
    });
  });

  describe("PUT", () => {
    test("without body", async () => {
      const response = await client.put("/echo").queryParam("name", "value").queryParams("repeated", [1, 2]).header("Authorization", "Bearer token").send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("method", "PUT");
      expect(response.body).not.toHaveProperty("contentType");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).not.toHaveProperty("body");
      const responseBody = response.body as EchoResponse;
      expect(responseBody.url).toMatch(new RegExp("/echo\\?name=value&repeated=1&repeated=2&cacheBust=\\d+"));
    });

    test("with body", async () => {
      const body = {
        key: "expirationDate",
        value: "1230",
      };
      const response = await client.put("/echo", body).queryParam("name", "value").queryParams("repeated", [1, 2]).header("Authorization", "Bearer token").send();
      expect(response.statusCode).toBe(200);
      expect(response.contentType).toMatch(/application\/json.*/);
      expect(response.body).toBeTruthy();
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("method", "PUT");
      expect(response.body).toHaveProperty("contentType", "application/json");
      expect(response.body).toHaveProperty("authorization", "Bearer token");
      expect(response.body).toHaveProperty("body", JSON.stringify(body));
      const responseBody = response.body as EchoResponse;
      expect(responseBody.url).toMatch(new RegExp("/echo\\?name=value&repeated=1&repeated=2&cacheBust=\\d+"));
    });
  });

  test("non-JSON response", async () => {
    const response = await client.get("/error").send();
    expect(response.statusCode).toBe(500);
    expect(response.contentType).toMatch(/text\/plain.*/);
    expect(response.body).toMatch(new RegExp("Error: /error\\?cacheBust=\\d+"));
  });

  test("empty response", async () => {
    const response = await client.get("/empty").send();
    expect(response.statusCode).toBe(204);
    expect(response.contentType).toBeUndefined();
    expect(response.body).toBeFalsy();
  });

  test("XHR error", async () => {
    const onSuccess = jest.fn();
    const result = await client
      .get("/xhrError")
      .send()
      .then(onSuccess)
      .catch((reason) => reason);
    expect(onSuccess).not.toBeCalled();
    expect(result).toHaveProperty("type", "error");
  });

  test("timeout", async () => {
    const onSuccess = jest.fn();
    const result = await client
      .get("/timeout")
      .send()
      .then(onSuccess)
      .catch((reason) => reason);
    expect(onSuccess).not.toBeCalled();
    expect(result).toHaveProperty("type", "timeout");
  });

  test("response conversion error", async () => {
    const onSuccess = jest.fn();
    const result = await client
      .get("/incorrectJson")
      .send()
      .then(onSuccess)
      .catch((reason) => reason);
    expect(onSuccess).not.toBeCalled();
    expect(result.name).toBe("SyntaxError");
  });
});

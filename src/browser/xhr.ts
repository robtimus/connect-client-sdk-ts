import { HttpClient, HttpRequest, HttpResponse } from "../http";
import { URLBuilder } from "../http/util";

function xhr(): XMLHttpRequest {
  if (typeof XMLHttpRequest !== "undefined" && (window.location.protocol !== "file:" || !window.ActiveXObject)) {
    return new XMLHttpRequest();
  }
  try {
    return new ActiveXObject("Msxml2.XMLHTTP.6.0");
  } catch (e) {
    /* ignore */
  }
  try {
    return new ActiveXObject("Msxml2.XMLHTTP.3.0");
  } catch (e) {
    /* ignore */
  }
  try {
    return new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
    /* ignore */
  }
  throw new Error("Could not initialze xhr");
}

function toHttpResponse(request: XMLHttpRequest): HttpResponse {
  const contentType = request.getResponseHeader("content-type") || undefined;
  if (contentType && /json/.test(contentType)) {
    return {
      statusCode: request.status,
      contentType,
      body: JSON.parse(request.responseText),
    };
  }
  return {
    statusCode: request.status,
    contentType,
    body: request.responseText,
  };
}

class XhrHttpRequest implements HttpRequest {
  private readonly urlBuilder: URLBuilder;
  private readonly headers: Record<string, string> = {};
  private readonly body?: string;
  private readonly timeout?: number;

  constructor(client: XhrHttpClient, private readonly method: string, url: string, body?: object) {
    this.urlBuilder = new URLBuilder(url);
    this.body = body ? JSON.stringify(body) : undefined;
    this.timeout = client.getTimeout();
  }

  queryParam(name: string, value?: string | number | boolean): HttpRequest {
    this.urlBuilder.queryParam(name, value);
    return this;
  }
  queryParams(name: string, values?: string[] | number[] | boolean[]): HttpRequest {
    this.urlBuilder.queryParams(name, values);
    return this;
  }
  header(name: string, value: string): HttpRequest {
    this.headers[name] = value;
    return this;
  }
  send(): Promise<HttpResponse> {
    return new Promise<HttpResponse>((resolve, reject) => {
      const url = this.urlBuilder.queryParam("cacheBust", new Date().getTime()).build();

      const request = xhr();
      request.onreadystatechange = () => {
        if (request.readyState === 4 && request.status !== 0) {
          try {
            resolve(toHttpResponse(request));
          } catch (e) {
            reject(e);
          }
        }
      };
      request.onabort = (event) => reject(event);
      request.onerror = (event) => reject(event);
      request.ontimeout = (event) => reject(event);
      if (this.timeout) {
        request.timeout = this.timeout;
      }

      request.open(this.method, url, true);
      for (const name in this.headers) {
        request.setRequestHeader(name, this.headers[name]);
      }
      if (this.body) {
        request.setRequestHeader("Content-Type", "application/json");
      }
      request.send(this.body);
    });
  }
}

Object.freeze(XhrHttpRequest.prototype);

class XhrHttpClient implements HttpClient {
  private timeout?: number;

  get(url: string): HttpRequest {
    return new XhrHttpRequest(this, "GET", url);
  }
  delete(url: string): HttpRequest {
    return new XhrHttpRequest(this, "DELETE", url);
  }
  post(url: string, body?: object): HttpRequest {
    return new XhrHttpRequest(this, "POST", url, body);
  }
  put(url: string, body?: object): HttpRequest {
    return new XhrHttpRequest(this, "PUT", url, body);
  }

  getTimeout(): number | undefined {
    return this.timeout;
  }
}

Object.freeze(XhrHttpClient.prototype);

/**
 * An HTTP client backed by XMLHttpRequest.
 */
export const xhrHttpClient: HttpClient = new XhrHttpClient();

import { HttpClient, HttpRequest, HttpResponse } from ".";
import { URLBuilder } from "./util";

async function toHttpResonse(response: Response): Promise<HttpResponse> {
  const contentType = response.headers.get("Content-Type") || undefined;
  if (contentType && /json/.test(contentType)) {
    const json = await response.json();
    return {
      statusCode: response.status,
      contentType,
      body: json,
    };
  }
  const blob = await response.blob();
  const body = await blob.text();
  return {
    statusCode: response.status,
    contentType,
    body,
  };
}

class FetchHttpRequest implements HttpRequest {
  private readonly urlBuilder: URLBuilder;
  private readonly headers: HeadersInit = {};
  private readonly body?: string;

  constructor(private readonly method: string, url: string, body?: object) {
    this.urlBuilder = new URLBuilder(url);
    this.body = body ? JSON.stringify(body) : undefined;
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
  async send(): Promise<HttpResponse> {
    const init: RequestInit = {
      method: this.method,
      headers: this.headers,
      body: this.body,
      mode: "cors",
      cache: "no-cache",
      redirect: "error",
    };
    if (this.body) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      init.headers!["Content-Type"] = "application/json";
    }
    const response = await fetch(this.urlBuilder.build(), init);
    return toHttpResonse(response);
  }
}

Object.freeze(FetchHttpRequest.prototype);

class FetchHttpClient implements HttpClient {
  get(url: string): HttpRequest {
    return new FetchHttpRequest("GET", url);
  }
  delete(url: string): HttpRequest {
    return new FetchHttpRequest("DELETE", url);
  }
  post(url: string, body?: object): HttpRequest {
    return new FetchHttpRequest("POST", url, body);
  }
  put(url: string, body?: object): HttpRequest {
    return new FetchHttpRequest("PUT", url, body);
  }
}

Object.freeze(FetchHttpClient.prototype);

export const fetchHttpClient: HttpClient = new FetchHttpClient();

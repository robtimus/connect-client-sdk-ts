export interface HttpClient {
  get(url: string): HttpRequest;
  delete(url: string): HttpRequest;
  post(url: string, body?: object): HttpRequest;
  put(url: string, body?: object): HttpRequest;
}

export interface HttpRequest {
  queryParam(name: string, value?: string | number | boolean): HttpRequest;
  queryParams(name: string, values?: string[] | number[] | boolean[]): HttpRequest;
  header(name: string, value: string): HttpRequest;
  send(): Promise<HttpResponse>;
}

export interface HttpResponse {
  statusCode: number;
  contentType?: string;
  body?: unknown;
}

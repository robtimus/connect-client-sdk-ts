/**
 * An interface describing HTTP clients.\
 * Implementing classes are responsible for setting the content type header if needed.
 * Implementations are also responsible for preventing response caching. If needed this can be done by adding a cache-bust query parameter.
 */
export interface HttpClient {
  /**
   * Prepares an HTTP GET request.
   * @param url The URL to send the request to.
   * @returns An object that can be used to configure and send the GET request.
   */
  get(url: string): HttpRequest;
  /**
   * Prepares an HTTP DELETE request.
   * @param url The URL to send the request to.
   * @returns An object that can be used to configure and send the DELETE request.
   */
  delete(url: string): HttpRequest;
  /**
   * Prepares an HTTP POST request.
   * @param url The URL to send the request to.
   * @param body The request body to send.
   * @returns An object that can be used to configure and send the POST request.
   */
  post(url: string, body?: object): HttpRequest;
  /**
   * Prepares an HTTP PUT request.
   * @param url The URL to send the request to.
   * @param body The request body to send.
   * @returns An object that can be used to configure and send the PUT request.
   */
  put(url: string, body?: object): HttpRequest;
}

/**
 * An interface describing an HTTP request to be sent.
 */
export interface HttpRequest {
  /**
   * Adds a query parameter. Should do nothing if the value is undefined.
   * @param name The name for the query parameter.
   * @param value The value for the query parameter.
   * @returns This HTTP request object.
   */
  queryParam(name: string, value?: string | number | boolean): HttpRequest;
  /**
   * Adds several query parameters with the same name. Should do nothing if the value is undefined.
   * @param name The name for each of the query parameters.
   * @param values The values for the query parameters.
   * @returns This HTTP request object.
   */
  queryParams(name: string, values?: string[] | number[] | boolean[]): HttpRequest;
  /**
   * Sets a header.
   * @param name The name for the header.
   * @param value The value for the header.
   * @returns This HTTP request object.
   */
  header(name: string, value: string): HttpRequest;
  /**
   * Sends the HTTP request.
   * @returns A promise that contains the HTTP response.
   */
  send(): Promise<HttpResponse>;
}

/**
 * An interface describing an HTTP response that was received.
 */
export interface HttpResponse {
  /**
   * The HTTP status code.
   */
  statusCode: number;
  /**
   * If available, the value of the Content-Type header.
   */
  contentType?: string;
  /**
   * If available, the response body.
   */
  body?: unknown;
}

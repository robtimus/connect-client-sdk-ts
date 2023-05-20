// Imported for TypeDoc
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { HttpRequest } from ".";

/**
 * A utility class that can be used to build URLs. This makes it useful for implementing {@link HttpRequest}.
 */
export class URLBuilder {
  readonly #url: string;
  #queryString: string;
  #queryStringSeparator = "?";

  /**
   * @param url The base URL. It should not contain any query string yet.
   */
  constructor(url: string) {
    this.#url = url;
    this.#queryString = "";
  }

  /**
   * Adds a query parameter. Does nothing if the value is undefined.
   * @param name The name for the query parameter.
   * @param value The value for the query parameter.
   * @returns This URL builder object.
   */
  queryParam(name: string, value?: string | number | boolean): this {
    if (value !== undefined) {
      this.#queryString += `${this.#queryStringSeparator}${name}=${value}`;
      this.#queryStringSeparator = "&";
    }
    return this;
  }
  /**
   * Adds several query parameters with the same name. Does nothing if the value is undefined.
   * @param name The name for each of the query parameters.
   * @param values The values for the query parameters.
   * @returns This URL builder object.
   */
  queryParams(name: string, values?: string[] | number[] | boolean[]): this {
    if (values !== undefined) {
      for (const value of values) {
        this.#queryString += `${this.#queryStringSeparator}${name}=${value}`;
        this.#queryStringSeparator = "&";
      }
    }
    return this;
  }
  /**
   * Builds a full URL.
   * @returns A URL built from the base URL and all added query parameters.
   */
  build(): string {
    return this.#url + this.#queryString;
  }
}

Object.freeze(URLBuilder.prototype);

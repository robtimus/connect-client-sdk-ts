export class URLBuilder {
  private queryString: string;
  private queryStringSeparator = "?";

  constructor(private readonly url: string) {
    this.queryString = "";
  }

  queryParam(name: string, value?: string | number | boolean): URLBuilder {
    if (typeof value !== "undefined") {
      this.queryString += `${this.queryStringSeparator}${name}=${value}`;
      this.queryStringSeparator = "&";
    }
    return this;
  }
  queryParams(name: string, values?: string[] | number[] | boolean[]): URLBuilder {
    if (typeof values !== "undefined") {
      for (const value of values) {
        this.queryString += `${this.queryStringSeparator}${name}=${value}`;
        this.queryStringSeparator = "&";
      }
    }
    return this;
  }
  build(): string {
    return this.url + this.queryString;
  }
}

Object.freeze(URLBuilder.prototype);

/**
 * @group unit:http
 */

import { URLBuilder } from "../../../src/http/util";

describe("URIBuilder", () => {
  test("no query params", () => {
    const url = new URLBuilder("http://localhost/path").build();
    expect(url).toBe("http://localhost/path");
  });

  describe("scalar query param", () => {
    test("string", () => {
      const url = new URLBuilder("http://localhost/path").queryParam("q", "v").build();
      expect(url).toBe("http://localhost/path?q=v");
    });

    test("number", () => {
      const url = new URLBuilder("http://localhost/path").queryParam("q", 1).build();
      expect(url).toBe("http://localhost/path?q=1");
    });

    test("boolean", () => {
      const url = new URLBuilder("http://localhost/path").queryParam("q", true).build();
      expect(url).toBe("http://localhost/path?q=true");
    });

    test("undefined", () => {
      const url = new URLBuilder("http://localhost/path").queryParam("q").build();
      expect(url).toBe("http://localhost/path");
    });
  });

  describe("array query param", () => {
    test("string", () => {
      const url = new URLBuilder("http://localhost/path").queryParams("q", ["v1", "v2"]).build();
      expect(url).toBe("http://localhost/path?q=v1&q=v2");
    });

    test("number", () => {
      const url = new URLBuilder("http://localhost/path").queryParams("q", [1, 2]).build();
      expect(url).toBe("http://localhost/path?q=1&q=2");
    });

    test("boolean", () => {
      const url = new URLBuilder("http://localhost/path").queryParams("q", [true, false]).build();
      expect(url).toBe("http://localhost/path?q=true&q=false");
    });

    test("undefined", () => {
      const url = new URLBuilder("http://localhost/path").queryParams("q").build();
      expect(url).toBe("http://localhost/path");
    });
  });

  test("multiple", () => {
    const url = new URLBuilder("http://localhost/path")
      .queryParam("s")
      .queryParam("s", "v")
      .queryParam("n")
      .queryParam("n", 1)
      .queryParam("b")
      .queryParam("b", true)
      .queryParams("s")
      .queryParams("s", ["v1", "v2"])
      .queryParams("n")
      .queryParams("n", [2, 3])
      .queryParams("b")
      .queryParams("b", [false, true])
      .build();
    expect(url).toBe("http://localhost/path?s=v&n=1&b=true&s=v1&s=v2&n=2&n=3&b=false&b=true");
  });
});

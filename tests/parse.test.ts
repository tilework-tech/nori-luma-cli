import { describe, it, expect } from "vitest";
import { InvalidArgumentError } from "commander";
import { parseIntStrict, parseFloatStrict, parseJSON } from "../src/parse.js";

describe("parseIntStrict", () => {
  it("parses valid integer strings", () => {
    expect(parseIntStrict("42")).toBe(42);
    expect(parseIntStrict("0")).toBe(0);
    expect(parseIntStrict("-7")).toBe(-7);
  });

  it("throws for non-numeric strings", () => {
    expect(() => parseIntStrict("abc")).toThrow(InvalidArgumentError);
  });

  it("throws for float strings", () => {
    expect(() => parseIntStrict("3.14")).toThrow(InvalidArgumentError);
  });

  it("throws for strings with trailing garbage", () => {
    expect(() => parseIntStrict("3abc")).toThrow(InvalidArgumentError);
  });
});

describe("parseFloatStrict", () => {
  it("parses valid float strings", () => {
    expect(parseFloatStrict("3.14")).toBeCloseTo(3.14);
    expect(parseFloatStrict("0")).toBe(0);
    expect(parseFloatStrict("-2.5")).toBeCloseTo(-2.5);
  });

  it("throws for non-numeric strings", () => {
    expect(() => parseFloatStrict("xyz")).toThrow(InvalidArgumentError);
  });

  it("throws for Infinity", () => {
    expect(() => parseFloatStrict("Infinity")).toThrow(InvalidArgumentError);
  });

  it("throws for strings with trailing garbage", () => {
    expect(() => parseFloatStrict("3.14abc")).toThrow(InvalidArgumentError);
  });
});

describe("parseJSON", () => {
  it("parses valid JSON", () => {
    expect(parseJSON('{"key":"value"}')).toEqual({ key: "value" });
  });

  it("throws for invalid JSON", () => {
    expect(() => parseJSON("not json")).toThrow(InvalidArgumentError);
  });
});

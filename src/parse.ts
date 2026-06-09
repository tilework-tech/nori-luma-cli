import { InvalidArgumentError } from "commander";

export function parseIntStrict(value: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n)) throw new InvalidArgumentError(`"${value}" is not a valid number.`);
  return n;
}

export function parseFloatStrict(value: string): number {
  const n = parseFloat(value);
  if (isNaN(n)) throw new InvalidArgumentError(`"${value}" is not a valid number.`);
  return n;
}

export function parseJSON(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new InvalidArgumentError(`invalid JSON: ${value}`);
  }
}

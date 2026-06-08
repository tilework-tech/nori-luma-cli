import { InvalidArgumentError } from "commander";

export function parseIntStrict(value: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n)) throw new InvalidArgumentError(`"${value}" is not a valid number.`);
  return n;
}

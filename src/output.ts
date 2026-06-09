export interface Output {
  write(message: string): void;
  error(message: string): void;
  setExitCode(code: number): void;
}

export function createProcessOutput(): Output {
  return {
    write(message: string) {
      process.stdout.write(message);
    },
    error(message: string) {
      process.stderr.write(message);
    },
    setExitCode(code: number) {
      process.exitCode = code;
    },
  };
}

declare namespace jest {
  interface Expect {
    anything(): unknown;
    any(classType: unknown): unknown;
    arrayContaining<E = unknown>(arr: E[]): unknown;
    objectContaining<E = unknown>(obj: E): unknown;
    stringMatching(str: string | RegExp): unknown;
    stringContaining(str: string): unknown;
  }
}

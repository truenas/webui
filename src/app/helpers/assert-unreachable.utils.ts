/**
 * This is useful in switch-case statements
 * to make sure that all enum cases are handled.
 * https://stephencharlesweiss.com/typescript-exhaustive-switch-statements
 */
export function assertUnreachable(value: never): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`No such case in exhaustive switch: ${value}`);
}

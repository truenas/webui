/**
 * This is useful in switch-case statements
 * to make sure that all enum cases are handled.
 * https://stephencharlesweiss.com/typescript-exhaustive-switch-statements
 *
 * If you get a type error that something is not assignable to never,
 * then you forgot to handle a case in a switch statement.
 *
 * DO NOT just use `as never` to silence the error.
 */
export function assertUnreachable(value: never): void {
  console.error(`No such case in exhaustive switch: ${String(value)}`);
}

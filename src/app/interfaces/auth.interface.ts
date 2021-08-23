export type LoginParams = [name: string, password: string]
| [name: string, password: string, otpToken: string];

export type CheckUserQuery = [
  username: string,
  password: string,
];

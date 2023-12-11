export type CheckUserQuery = [
  username: string,
  password: string,
];

export type LoginQuery = [
  username: string,
  password: string,
  otp?: string,
];

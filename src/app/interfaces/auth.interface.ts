// TODO: Typescript 4, add tuple names: name, password / name, password, otpToken
export type LoginParams = [string, string] | [string, string, string];

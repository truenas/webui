import { LoggedInUser } from 'app/interfaces/ds-cache.interface';

export enum LoginExResponseType {
  Success = 'SUCCESS',
  AuthErr = 'AUTH_ERR',
  Expired = 'EXPIRED',
  OtpRequired = 'OTP_REQUIRED',
}

export enum LoginExMechanism {
  PasswordPlain = 'PASSWORD_PLAIN',
  OtpToken = 'OTP_TOKEN',
  TokenPlain = 'TOKEN_PLAIN',
  ApiKeyPlain = 'API_KEY_PLAIN',
}

export enum AuthenticatorLoginLevel {
  Level1 = 'LEVEL_1',
  Level2 = 'LEVEL_2',
}

export interface LoginSuccessResponse {
  response_type: LoginExResponseType.Success;
  user_info: LoggedInUser;
  authenticator: AuthenticatorLoginLevel;
}

export interface LoginAuthErrorResponse {
  response_type: LoginExResponseType.AuthErr;
}

export interface LoginExpiredResponse {
  response_type: LoginExResponseType.Expired;
}

export interface LoginOtpRequiredResponse {
  response_type: LoginExResponseType.OtpRequired;
  username: string;
}

export type LoginExResponse =
  | LoginSuccessResponse
  | LoginAuthErrorResponse
  | LoginExpiredResponse
  | LoginOtpRequiredResponse;

export type LoginExQuery =
  | LoginExPasswordQuery
  | LoginExOtpTokenQuery
  | LoginExAuthTokenQuery
  | LoginExApiKeyQuery;

export interface LoginExPasswordQuery {
  mechanism: LoginExMechanism.PasswordPlain;
  username: string;
  password: string;
}

export interface LoginExOtpTokenQuery {
  mechanism: LoginExMechanism.OtpToken;
  otp_token: string;
}

export interface LoginExAuthTokenQuery {
  mechanism: LoginExMechanism.TokenPlain;
  token: string;
}

export interface LoginExApiKeyQuery {
  mechanism: LoginExMechanism.ApiKeyPlain;
  username: string;
  api_key: string;
}

export type AuthTokenParams = [
  /**
   * Default is 600
   */
  ttl?: number,
  /**
   * Default is {}
   */
  attrs?: Record<string, unknown>,
  /**
   * Default is true
   */
  match_origin?: boolean,
  /**
   * Default is false
   */
  single_use?: boolean,
];

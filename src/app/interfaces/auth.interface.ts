import { LoggedInUser } from 'app/interfaces/ds-cache.interface';

export enum LoginExResponseType {
  Success = 'SUCCESS',
  AuthErr = 'AUTH_ERR',
  Expired = 'EXPIRED',
  OtpRequired = 'OTP_REQUIRED',
  Redirect = 'REDIRECT',
  Denied = 'DENIED',
}

export enum AuthenticatorLoginLevel {
  Level1 = 'LEVEL_1',
  Level2 = 'LEVEL_2',
}

export interface LoginSuccessResponse {
  response_type: LoginExResponseType.Success;
  user_info: LoggedInUser;
  authenticator: AuthenticatorLoginLevel;
  reconnect_token: string | null;
}

export interface LoginAuthErrorResponse {
  response_type: LoginExResponseType.AuthErr;
}

export interface LoginExpiredResponse {
  response_type: LoginExResponseType.Expired;
}

export interface LoginRedirectResponse {
  response_type: LoginExResponseType.Redirect;
  urls: string[];
}

export interface LoginOtpRequiredResponse {
  response_type: LoginExResponseType.OtpRequired;
  username: string;
}

export interface LoginDeniedResponse {
  response_type: LoginExResponseType.Denied;
}

export type LoginExResponse
  = | LoginSuccessResponse
    | LoginAuthErrorResponse
    | LoginExpiredResponse
    | LoginRedirectResponse
    | LoginOtpRequiredResponse
    | LoginDeniedResponse;

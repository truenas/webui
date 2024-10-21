import { LoggedInUser } from 'app/interfaces/ds-cache.interface';

export enum LoginExResponseType {
  Success = 'SUCCESS',
  AuthErr = 'AUTH_ERR',
  Expired = 'EXPIRED',
  OtpRequired = 'OTP_REQUIRED',
}

export interface LoginExResponse {
  response_type: LoginExResponseType;
  user_info?: LoggedInUser;
  username?: string;
}

export type LoginExQuery =
  | LoginExPasswordQuery
  | LoginExOtpTokenQuery
  | LoginExAuthTokenQuery
  | LoginExApiKeyQuery;

interface LoginExPasswordQuery {
  mechanism: 'PASSWORD_PLAIN';
  username: string;
  password: string;
}

interface LoginExOtpTokenQuery {
  mechanism: 'OTP_TOKEN';
  otp_token: string;
}

interface LoginExAuthTokenQuery {
  mechanism: 'TOKEN_PLAIN';
  token: string;
}

interface LoginExApiKeyQuery {
  mechanism: 'API_KEY_PLAIN';
  username: string;
  api_key: string;
}

import { AuthError, AuthErrorCode, AuthResponse } from '@truenas/api-client';
import { of, Observable, OperatorFunction, catchError, map, throwError } from 'rxjs';
import { LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';

/** The codes the authenticator throws when middleware refused the credential itself. */
const refusedCredentialCodes: AuthErrorCode[] = [
  AuthErrorCode.PasswordAuthFailed,
  AuthErrorCode.OtpAuthFailed,
  AuthErrorCode.ApiKeyAuthFailed,
  AuthErrorCode.TokenAuthFailed,
];

/**
 * Reads the authenticator's answer as the `auth.login_ex` result the UI is written against. Both
 * types describe the same wire object, but the client's declares only the fields it reads: its
 * `user_info` lacks `pw_name`, `two_factor_config` and the `webui_access`/`web_shell` privileges,
 * and its enum lacks `DENIED`. Hence a cast, not a mapping that would have to invent those fields.
 */
export function toLoginExResponse(response: AuthResponse): LoginExResponse {
  return response as unknown as LoginExResponse;
}

/**
 * Turns login failures the authenticator throws back into the response they came from, so
 * `processLoginResult` maps `EXPIRED`, `DENIED` and `REDIRECT` for a token login as it does for an
 * interactive one. A refusal without an answer reads as `AUTH_ERR`. Anything else, such as a
 * transport failure or a superseded login, propagates.
 */
export function recoverLoginFailure(): OperatorFunction<LoginExResponse, LoginExResponse> {
  return catchError((error: unknown): Observable<LoginExResponse> => {
    if (error instanceof AuthError && refusedCredentialCodes.includes(error.code)) {
      return of(error.response ? toLoginExResponse(error.response) : { response_type: LoginExResponseType.AuthErr });
    }

    return throwError(() => error);
  });
}

/** Reads a login through both of the above, in the order they have to happen. */
export function asLoginExResponse(): OperatorFunction<AuthResponse, LoginExResponse> {
  return (source$) => source$.pipe(
    map(toLoginExResponse),
    recoverLoginFailure(),
  );
}

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
 * The authenticator's answer, read as the `auth.login_ex` result the UI is
 * written against.
 *
 * Both types describe the same wire object; the client's is the narrower and
 * partly differently-named view of it, because the client only ever needed the
 * handful of fields its own logic reads. `user_info` is the clearest case: the
 * client declares `username`, `two_factor_auth_configured` and a `privilege`
 * carrying nothing but roles, where middleware also sends `pw_name`,
 * `account_attributes`, `two_factor_config` and the `webui_access` and
 * `web_shell` privileges the UI decides access from. `response_type` is the
 * other: `DENIED` is a value middleware returns and the client's enum does not
 * list.
 *
 * So this is a re-reading of one object, not a conversion between two — hence
 * a cast rather than a mapping, which would have to invent the fields the
 * client does not name.
 */
export function toLoginExResponse(response: AuthResponse): LoginExResponse {
  return response as unknown as LoginExResponse;
}

/**
 * Login failures the authenticator reports by throwing, put back as the
 * response they came from.
 *
 * The authenticator throws on `AUTH_ERR` for password and OTP logins, and on
 * every non-success for a token login. The UI answers all of those the same
 * way — "wrong username or password", "incorrect or expired OTP", "your
 * session expired" — so `AUTH_ERR` is what they are read back as. A token
 * login loses the distinction between `EXPIRED` and `DENIED` doing it, which
 * the client does not carry on the error; both already led here.
 *
 * Anything else — a transport failure, a login superseded by a later one — is
 * a genuine error and is left to propagate.
 */
export function recoverLoginFailure(): OperatorFunction<LoginExResponse, LoginExResponse> {
  return catchError((error: unknown): Observable<LoginExResponse> => {
    if (error instanceof AuthError && refusedCredentialCodes.includes(error.code)) {
      return of({ response_type: LoginExResponseType.AuthErr });
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

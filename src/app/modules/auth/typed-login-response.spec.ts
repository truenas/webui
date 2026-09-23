import { AuthError, AuthErrorCode, AuthResponse, AuthResponseType } from '@truenas/api-client';
import { firstValueFrom, of, throwError } from 'rxjs';
import { LoginExResponseType } from 'app/interfaces/auth.interface';
import { asLoginExResponse, toLoginExResponse } from 'app/modules/auth/typed-login-response';

describe('typed login response', () => {
  describe('toLoginExResponse', () => {
    it('keeps the fields middleware sends that the client does not declare', () => {
      // The client's `user_info` names `username` and a privilege carrying only
      // roles; the UI decides access from `pw_name`, `account_attributes` and
      // `webui_access`, which are on the same wire object.
      const wire = {
        response_type: AuthResponseType.Success,
        user_info: {
          pw_name: 'root',
          account_attributes: ['LOCAL'],
          privilege: { webui_access: true, web_shell: true },
        },
      } as unknown as AuthResponse;

      expect(toLoginExResponse(wire)).toMatchObject({
        response_type: LoginExResponseType.Success,
        user_info: {
          pw_name: 'root',
          account_attributes: ['LOCAL'],
          privilege: { webui_access: true, web_shell: true },
        },
      });
    });
  });

  describe('asLoginExResponse', () => {
    it('passes a successful login straight through', async () => {
      const response = { response_type: AuthResponseType.Success } as AuthResponse;

      expect(await firstValueFrom(of(response).pipe(asLoginExResponse())))
        .toEqual({ response_type: LoginExResponseType.Success });
    });

    // The authenticator reports a refused credential by throwing. Each of these
    // has to come back as a response the sign-in form can render inline, or the
    // user gets an error modal where they should be told to try again. The list
    // is hand-maintained against the library's enum, so every member is pinned.
    const refusedCodes = [
      AuthErrorCode.PasswordAuthFailed,
      AuthErrorCode.OtpAuthFailed,
      AuthErrorCode.ApiKeyAuthFailed,
      AuthErrorCode.TokenAuthFailed,
    ];

    it.each(refusedCodes)('reads %s back as a refused login rather than an error', async (code) => {
      const refused$ = throwError(() => new AuthError(code, 'refused')).pipe(asLoginExResponse());

      expect(await firstValueFrom(refused$)).toEqual({ response_type: LoginExResponseType.AuthErr });
    });

    it('covers every refused-credential code the library declares', () => {
      // A code added to the library that belongs on the list but is not on it
      // would silently turn a refused credential back into an error modal, so
      // the leftovers are pinned by value. Asserted as strings rather than enum
      // members because one of them is deprecated.
      const leftovers = Object.values(AuthErrorCode)
        .filter((code) => !refusedCodes.includes(code))
        .sort((first, second) => first.localeCompare(second));

      expect(leftovers).toEqual(['FULL_ADMIN_REQUIRED', 'LOGIN_SUPERSEDED']);
    });

    it('lets a superseded login through as the error it is', async () => {
      const superseded = new AuthError(AuthErrorCode.LoginSuperseded, 'superseded');

      await expect(firstValueFrom(throwError(() => superseded).pipe(asLoginExResponse())))
        .rejects.toBe(superseded);
    });

    it('lets a transport failure through as the error it is', async () => {
      const broken = new Error('socket gone');

      await expect(firstValueFrom(throwError(() => broken).pipe(asLoginExResponse())))
        .rejects.toBe(broken);
    });
  });
});

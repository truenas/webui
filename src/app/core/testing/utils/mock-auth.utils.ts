import {
  ExistingProvider, FactoryProvider, forwardRef, ValueProvider,
} from '@angular/core';
import { createSpyObject } from '@ngneat/spectator/jest';
import { Observable } from 'rxjs';
import { DeepPartial } from 'utility-types';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';

export const dummyUser = {
  privilege: {
    roles: {
      $set: Object.values(Role),
    },
    web_shell: true,
  },
  account_attributes: [AccountAttribute.Local, AccountAttribute.SysAdmin],
  pw_name: 'root',
  attributes: {} as LoggedInUser['attributes'],
  two_factor_config: {} as LoggedInUser['two_factor_config'],
  pw_uid: 0,
} as LoggedInUser;

/**
 * Provides a dummy user with full admin privileges.
 * To set custom roles, inject `MockAuthService` and call `setRoles`.
 */
export function mockAuth(
  user: DeepPartial<LoggedInUser> = dummyUser,
): (FactoryProvider | ExistingProvider | ValueProvider)[] {
  return [
    {
      provide: TokenLastUsedService,
      useValue: createSpyObject(TokenLastUsedService),
    },
    {
      provide: ErrorHandlerService,
      useValue: {
        ...createSpyObject(ErrorHandlerService),
        withErrorHandler: () => <T>(source$: Observable<T>) => source$,
      },
    },
    {
      provide: WINDOW,
      useValue: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        sessionStorage: {
          removeItem: jest.fn(),
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
          key: jest.fn(),
          length: 0,
        },
        localStorage: {
          removeItem: jest.fn(),
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
          key: jest.fn(),
          length: 0,
        },
        document: {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          querySelector: jest.fn(),
          querySelectorAll: jest.fn((): Element[] => []),
          createElement: jest.fn(() => ({
            setAttribute: jest.fn(),
            style: {},
          })),
          body: {
            appendChild: jest.fn(),
            removeChild: jest.fn(),
          },
        },
        location: {
          href: 'http://localhost/',
          protocol: 'http:',
          hostname: 'localhost',
          port: '',
          pathname: '/',
          search: '',
          hash: '',
          reload: jest.fn(),
          replace: jest.fn(),
          toString: jest.fn(() => 'http://localhost/'),
        },
        open: jest.fn(),
      },
    },
    {
      provide: AuthService,
      useFactory: () => {
        const mockService = new MockAuthService();

        mockService.setUser(user as LoggedInUser);
        return mockService;
      },
    },
    {
      provide: MockAuthService,
      useExisting: forwardRef(() => AuthService),
    },
  ];
}

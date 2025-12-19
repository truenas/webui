import { Injectable, inject } from '@angular/core';
import { AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, catchError, debounceTime, forkJoin, map, of, switchMap,
} from 'rxjs';
import { UserService } from 'app/services/user.service';

/**
 * Service providing async validators for user and group existence checks.
 * Used in forms where users can input user/group names that need to be validated
 * against the system (local or directory services).
 */
@Injectable({ providedIn: 'root' })
export class UserGroupExistenceValidationService {
  private userService = inject(UserService);
  private translate = inject(TranslateService);

  /**
   * Creates an async validator that checks if all specified groups exist in the system.
   * Provides real-time feedback with debouncing to prevent excessive API calls.
   *
   * @param debounceMs - Debounce time in milliseconds. Defaults to 500ms.
   * @returns AsyncValidatorFn that validates group existence
   *
   * @example
   * ```typescript
   * this.form.controls.groups.addAsyncValidators([
   *   this.validationService.validateGroupsExist()
   * ]);
   * ```
   */
  validateGroupsExist(debounceMs = 500): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> => {
      const groups = control.value as string[];

      if (!groups || groups.length === 0) {
        return of(null);
      }

      // Debounce BEFORE API calls to prevent firing them on every keystroke
      return of(groups).pipe(
        debounceTime(debounceMs),
        switchMap((debouncedGroups) => {
          const groupChecks = debouncedGroups.map((groupName: string) => {
            return this.userService.getGroupByName(groupName).pipe(
              map(() => ({ name: groupName, exists: true })),
              catchError(() => of({ name: groupName, exists: false })),
            );
          });
          return forkJoin(groupChecks);
        }),
        map((results) => {
          const nonExistent = results
            .filter((result) => !result.exists)
            .map((result) => result.name);

          if (nonExistent.length > 0) {
            return {
              groupsDoNotExist: {
                message: this.translate.instant(
                  'The following groups do not exist: {groups}',
                  { groups: nonExistent.join(', ') },
                ),
              },
            };
          }

          return null;
        }),
      );
    };
  }

  /**
   * Creates an async validator that checks if all specified users exist in the system.
   * Provides real-time feedback with debouncing to prevent excessive API calls.
   *
   * @param debounceMs - Debounce time in milliseconds. Defaults to 500ms.
   * @returns AsyncValidatorFn that validates user existence
   *
   * @example
   * ```typescript
   * this.form.controls.users.addAsyncValidators([
   *   this.validationService.validateUsersExist()
   * ]);
   * ```
   */
  validateUsersExist(debounceMs = 500): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> => {
      const users = control.value as string[];

      if (!users || users.length === 0) {
        return of(null);
      }

      // Debounce BEFORE API calls to prevent firing them on every keystroke
      return of(users).pipe(
        debounceTime(debounceMs),
        switchMap((debouncedUsers) => {
          const userChecks = debouncedUsers.map((username: string) => {
            return this.userService.getUserByName(username).pipe(
              map(() => ({ name: username, exists: true })),
              catchError(() => of({ name: username, exists: false })),
            );
          });
          return forkJoin(userChecks);
        }),
        map((results) => {
          const nonExistent = results
            .filter((result) => !result.exists)
            .map((result) => result.name);

          if (nonExistent.length > 0) {
            return {
              usersDoNotExist: {
                message: this.translate.instant(
                  'The following users do not exist: {users}',
                  { users: nonExistent.join(', ') },
                ),
              },
            };
          }

          return null;
        }),
      );
    };
  }
}

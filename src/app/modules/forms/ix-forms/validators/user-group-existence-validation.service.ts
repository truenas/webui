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
   * Note: This validator has its own debouncing even though the input components (ix-chips, ix-combobox)
   * already debounce autocomplete fetches. This is intentional because:
   * - Autocomplete debouncing optimizes UI responsiveness for suggestions
   * - Validation debouncing optimizes API calls for existence checks
   * - Users can type custom values not in autocomplete, which still need validation
   * - The two operations have different lifecycles (suggestions vs. validation)
   *
   * @param debounceMs - Debounce time in milliseconds. Defaults to 300ms.
   * @returns AsyncValidatorFn that validates group existence
   *
   * @example
   * ```typescript
   * this.form.controls.groups.addAsyncValidators([
   *   this.validationService.validateGroupsExist()
   * ]);
   * ```
   */
  validateGroupsExist(debounceMs = 300): AsyncValidatorFn {
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
            return this.userService.getGroupByNameCached(groupName).pipe(
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
   * Note: This validator has its own debouncing even though the input components (ix-chips, ix-combobox)
   * already debounce autocomplete fetches. This is intentional because:
   * - Autocomplete debouncing optimizes UI responsiveness for suggestions
   * - Validation debouncing optimizes API calls for existence checks
   * - Users can type custom values not in autocomplete, which still need validation
   * - The two operations have different lifecycles (suggestions vs. validation)
   *
   * @param debounceMs - Debounce time in milliseconds. Defaults to 300ms.
   * @returns AsyncValidatorFn that validates user existence
   *
   * @example
   * ```typescript
   * this.form.controls.users.addAsyncValidators([
   *   this.validationService.validateUsersExist()
   * ]);
   * ```
   */
  validateUsersExist(debounceMs = 300): AsyncValidatorFn {
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
            return this.userService.getUserByNameCached(username).pipe(
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

  /**
   * Creates an async validator that checks if a single user exists in the system.
   * Used for combobox components where only one user can be selected.
   *
   * @param debounceMs - Debounce time in milliseconds. Defaults to 300ms.
   * @returns AsyncValidatorFn that validates single user existence
   *
   * @example
   * ```typescript
   * this.form.controls.owner.addAsyncValidators([
   *   this.validationService.validateUserExists()
   * ]);
   * ```
   */
  validateUserExists(debounceMs = 300): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> => {
      const username = control.value as string;

      if (!username || username.trim() === '') {
        return of(null);
      }

      return of(username).pipe(
        debounceTime(debounceMs),
        switchMap((debouncedUsername): Observable<ValidationErrors | null> => {
          return this.userService.getUserByNameCached(debouncedUsername).pipe(
            map((): null => null),
            catchError((): Observable<ValidationErrors> => of({
              userDoesNotExist: {
                message: this.translate.instant(
                  'User "{username}" does not exist',
                  { username: debouncedUsername },
                ),
              },
            })),
          );
        }),
      );
    };
  }

  /**
   * Creates an async validator that checks if a single group exists in the system.
   * Used for combobox components where only one group can be selected.
   *
   * @param debounceMs - Debounce time in milliseconds. Defaults to 300ms.
   * @returns AsyncValidatorFn that validates single group existence
   *
   * @example
   * ```typescript
   * this.form.controls.ownerGroup.addAsyncValidators([
   *   this.validationService.validateGroupExists()
   * ]);
   * ```
   */
  validateGroupExists(debounceMs = 300): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> => {
      const groupName = control.value as string;

      if (!groupName || groupName.trim() === '') {
        return of(null);
      }

      return of(groupName).pipe(
        debounceTime(debounceMs),
        switchMap((debouncedGroupName): Observable<ValidationErrors | null> => {
          return this.userService.getGroupByNameCached(debouncedGroupName).pipe(
            map((): null => null),
            catchError((): Observable<ValidationErrors> => of({
              groupDoesNotExist: {
                message: this.translate.instant(
                  'Group "{groupName}" does not exist',
                  { groupName: debouncedGroupName },
                ),
              },
            })),
          );
        }),
      );
    };
  }
}

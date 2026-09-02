import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  TnDirectoryQuery, TnPrincipalOption, TnUserDirectory, TnUserDirectoryLabels,
} from '@truenas/ui-components';
import { Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { Group } from 'app/interfaces/group.interface';
import { QueryFilter, QueryFilters, QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';

/**
 * How a `tn-user-*` / `tn-group-*` field narrows the list, as this app defines
 * it. Bound with `[directoryOptions]`, and read only here.
 *
 * @example
 * ```html
 * <tn-group-autocomplete
 *   formControlName="group"
 *   [directoryOptions]="{ localOnly: true, valueField: 'id' }" />
 * ```
 */
// A type alias rather than an interface: only an alias gets TypeScript's implicit
// index signature, and without one this is not assignable to the library's
// `TnDirectoryQuery` (`Readonly<Record<string, unknown>>`) when bound in a template.
export interface TrueNasDirectoryOptions {
  /**
   * Which field of the record becomes the control's value. Defaults to the
   * name (`username` / `group`), which is what the API takes nearly everywhere.
   */
  valueField?: keyof Pick<User, 'username' | 'uid' | 'id'> | keyof Pick<Group, 'group' | 'gid' | 'id'>;
  /** `Smb` restricts the list to SMB-capable users or groups. */
  queryType?: ComboboxQueryType;
  /** Groups only: restrict to local groups — directory-service ones excluded. */
  localOnly?: boolean;
  /**
   * Groups only: exclude immutable (built-in) groups. Separate from
   * {@link localOnly} because the two call sites differ — a privilege can be
   * granted to a built-in local group, while an ownership picker only offers
   * groups that can actually be edited.
   */
  mutableOnly?: boolean;
  /** Groups only: ids to drop from the results (e.g. the group being edited). */
  excludedIds?: number[];
  /**
   * Users only: extra filters and options merged into `user.query`, for a field
   * that offers only some users — `roles != []`, say. Bypasses `UserService`'s
   * autocomplete cache, since that takes no extra filters.
   */
  queryParams?: QueryParams<User>;
}

/** Rows per page. Matches `UserService`'s own `limit`. */
const pageSize = 50;

/**
 * This app's implementation of the component library's user/group store.
 *
 * It is the whole seam between the `tn-user-*` / `tn-group-*` fields and
 * TrueNAS: the fields own searching, paging, validation and the create flow,
 * and everything below is the part that is genuinely about this product —
 * which endpoint answers a lookup, how a query is narrowed, which record field
 * is the value, and what "create a user" means.
 *
 * Replaces five near-identical webui wrappers (`ix-user-combobox`,
 * `ix-group-combobox`, `ix-user-chips`, `ix-group-chips`, `ix-user-picker`) and
 * the per-form `BehaviorSubject` → `debounceTime` → `switchMap` → `shareReplay`
 * pipelines that sat beside them.
 */
@Injectable({ providedIn: 'root' })
export class TrueNasUserDirectory implements TnUserDirectory {
  private userService = inject(UserService);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);

  readonly pageSize = pageSize;

  queryUsers(search: string, page: number, options: TnDirectoryQuery): Observable<TnPrincipalOption[]> {
    const { valueField = 'username', queryType, queryParams } = options as TrueNasDirectoryOptions;
    const offset = page * pageSize;

    // A field with its own filters cannot go through UserService, whose
    // autocomplete cache takes none — it queries the endpoint directly.
    let users$: Observable<User[]>;
    if (queryParams) {
      users$ = this.queryUsersWithParams(search, offset, queryParams, queryType);
    } else if (queryType === ComboboxQueryType.Smb) {
      users$ = this.userService.smbUserQueryDsCache(search, offset);
    } else {
      users$ = this.userService.userQueryDsCache(search, offset);
    }

    return users$.pipe(
      map((users) => users.map((user) => toOption(user.username, user[valueField as keyof User]))),
    );
  }

  queryGroups(search: string, page: number, options: TnDirectoryQuery): Observable<TnPrincipalOption[]> {
    const {
      valueField = 'group', queryType, localOnly, mutableOnly, excludedIds = [],
    } = options as TrueNasDirectoryOptions;
    const offset = page * pageSize;

    let groups$: Observable<Group[]>;
    if (queryType === ComboboxQueryType.Smb) {
      // `localOnly` is deliberately not applied to SMB queries — SMB groups
      // legitimately include directory-service ones.
      groups$ = this.userService.smbGroupQueryDsCache(search, false, offset);
    } else {
      const filters: QueryFilter<Group>[] = [];
      if (localOnly) {
        filters.push(['local', '=', true]);
      }
      if (mutableOnly) {
        filters.push(['immutable', '=', false]);
      }
      groups$ = this.userService.groupQueryDsCache(search, false, offset, filters);
    }

    return groups$.pipe(
      // Client-side, so an exclusion makes its page short. That only ends
      // paging early, and the dropped rows are ones the caller does not want.
      map((groups) => (excludedIds.length
        ? groups.filter((group) => !excludedIds.includes(group.id))
        : groups)),
      map((groups) => groups.map((group) => toOption(group.group, group[valueField as keyof Group]))),
    );
  }

  /**
   * Whether a username resolves. Both caches are consulted first — the fields
   * call this on every validation pass, and a directory-service lookup is slow
   * enough that repeating it per keystroke is felt.
   */
  userExists(username: string): Observable<boolean> {
    if (this.userService.isUserInAutocompleteCache(username)) {
      return of(true);
    }
    if (this.userService.isUserCachedAsNonExistent(username)) {
      return of(false);
    }

    return this.userService.getUserByNameCached(username).pipe(
      map(() => true),
      catchError(() => {
        // Remembered, so a name already known to be wrong is not re-queried on
        // every later keystroke.
        this.userService.recordUserAsNonExistent(username);
        return of(false);
      }),
    );
  }

  /** Whether a group name resolves, on the same terms as {@link userExists}. */
  groupExists(groupName: string): Observable<boolean> {
    if (this.userService.isGroupInAutocompleteCache(groupName)) {
      return of(true);
    }
    if (this.userService.isGroupCachedAsNonExistent(groupName)) {
      return of(false);
    }

    return this.userService.getGroupByNameCached(groupName).pipe(
      map(() => true),
      catchError(() => {
        this.userService.recordGroupAsNonExistent(groupName);
        return of(false);
      }),
    );
  }

  /**
   * Opens the user form in a side panel, resolving to the created user — or to
   * null when it was dismissed.
   *
   * Imported dynamically: this service is provided at the root, and a static
   * import would pull a page component (and its dependency tree) into the
   * initial bundle for every app that never opens a user picker.
   */
  createUser(options: TnDirectoryQuery): Observable<TnPrincipalOption | null> {
    const { valueField = 'username' } = options as TrueNasDirectoryOptions;

    return from(import('app/pages/credentials/users/user-form/user-form.component')).pipe(
      switchMap((module) => this.formPanel.open(module.UserFormComponent, {
        wide: true,
        title: this.translate.instant('Add User'),
      })),
      map(({ response }) => (response
        ? toOption(response.username, response[valueField as keyof User] as string | number)
        : null)),
    );
  }

  /**
   * The library's field copy, translated. Registered alongside the directory
   * itself so the messages follow the app's language.
   */
  labels(): TnUserDirectoryLabels {
    return {
      userPlaceholder: this.translate.instant('Type to search users...'),
      groupPlaceholder: this.translate.instant('Type to search groups...'),
      addUser: this.translate.instant('Add New'),
      // `{name}` / `{names}` are the library's own placeholders, substituted
      // after translation — so they must survive it verbatim.
      userDoesNotExist: this.translate.instant('User "{name}" does not exist'),
      groupDoesNotExist: this.translate.instant('Group "{name}" does not exist'),
      usersDoNotExist: this.translate.instant('The following users do not exist: {names}'),
      groupsDoNotExist: this.translate.instant('The following groups do not exist: {names}'),
    };
  }

  private queryUsersWithParams(
    search: string,
    offset: number,
    queryParams: QueryParams<User>,
    queryType?: ComboboxQueryType,
  ): Observable<User[]> {
    const [baseFilters = [], baseOptions = {}] = queryParams;
    const filters: QueryFilters<User> = [...baseFilters];

    if (queryType === ComboboxQueryType.Smb) {
      filters.unshift(['smb', '=', true]);
    }

    const trimmed = search?.trim();
    if (trimmed) {
      // Case-insensitive regex with backslashes escaped, so a domain-prefixed
      // username ("ACME\admin") is searchable by typing it verbatim.
      filters.unshift(['username', '~', `(?i).*${trimmed.replaceAll('\\', '\\\\')}`]);
    }

    return this.api.call('user.query', [filters, { ...baseOptions, offset, limit: pageSize }]);
  }
}

/**
 * Usernames and group names are data, not copy — `ignoreTranslation` keeps them
 * out of the extracted string catalogue while satisfying `TranslatedString`.
 */
function toOption(label: string, value: unknown): TnPrincipalOption {
  return { label: ignoreTranslation(label), value: value as string | number };
}

import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TnSelectOption } from '@truenas/ui-components';
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
 * The value a user or group field commits. A name at nearly every call site,
 * but an id where the API takes one — so it is deliberately not narrowed.
 */
export type PrincipalValue = string | number;

/** An option in a user or group field: the name is displayed, the value committed. */
export type PrincipalOption = TnSelectOption<PrincipalValue>;

/** Fields of a `User` a picker may commit as its value. */
const userValueFields = ['username', 'uid', 'id'] as const;
export type UserValueField = typeof userValueFields[number];

/** Fields of a `Group` a picker may commit as its value. */
const groupValueFields = ['group', 'gid', 'id'] as const;
export type GroupValueField = typeof groupValueFields[number];

/**
 * How an `ix-user-*` / `ix-group-*` field narrows the list. Bound with
 * `[directoryOptions]`, and interpreted only here.
 *
 * @example
 * ```html
 * <ix-group-combobox
 *   formControlName="group"
 *   [directoryOptions]="{ localOnly: true, valueField: 'id' }" />
 * ```
 */
export interface DirectoryQueryOptions {
  /**
   * Which field of the record becomes the control's value. Defaults to the
   * name (`username` / `group`), which is what the API takes nearly everywhere.
   *
   * The two halves of the union cannot be told apart by the type system here —
   * one bag serves both kinds of field — so a group field's `gid` on a user
   * field type-checks. {@link resolveValueField} catches that at runtime and
   * falls back to the name, rather than committing `undefined` as the value.
   */
  valueField?: UserValueField | GroupValueField;
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
export const directoryPageSize = 50;

/**
 * The query-shaping layer behind the `ix-user-*` / `ix-group-*` fields.
 *
 * The fields own searching, paging, validation and the create flow — all of it
 * generic, and all of it built on `tn-autocomplete` / `tn-chip-input`.
 * Everything here is the part that is genuinely about TrueNAS: which endpoint
 * answers a lookup, how a query is narrowed, which record field is the value,
 * and what "create a user" means.
 *
 * It stays in webui rather than in `@truenas/ui-components` on purpose — a
 * `user.query` filter, an SMB flag and an immutable built-in group are product
 * concepts, not component-library ones.
 */
@Injectable({ providedIn: 'root' })
export class UserDirectoryService {
  private userService = inject(UserService);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);

  readonly pageSize = directoryPageSize;

  /**
   * One page of users matching `search`. `page` is zero-based, and a page
   * shorter than {@link pageSize} ends pagination.
   */
  queryUsers(search: string, page: number, options: DirectoryQueryOptions): Observable<PrincipalOption[]> {
    const valueField = resolveValueField(options.valueField, userValueFields, 'username');
    const { queryType, queryParams } = options;
    const offset = page * directoryPageSize;

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
      map((users) => users.map((user) => toOption(user.username, user[valueField]))),
    );
  }

  /** One page of groups matching `search`, on the same terms as {@link queryUsers}. */
  queryGroups(search: string, page: number, options: DirectoryQueryOptions): Observable<PrincipalOption[]> {
    const valueField = resolveValueField(options.valueField, groupValueFields, 'group');
    const {
      queryType, localOnly, mutableOnly, excludedIds = [],
    } = options;
    const offset = page * directoryPageSize;

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
      map((groups) => groups.map((group) => toOption(group.group, group[valueField]))),
    );
  }

  /**
   * Whether a username resolves. Both caches are consulted first — the fields
   * call this on every validation pass, and a directory-service lookup is slow
   * enough that repeating it per keystroke is felt.
   *
   * The fields fail open on a transport error — a lookup that errors, or
   * completes without emitting, is read as "cannot say" and the name is left
   * unflagged. Only an emitted `false` marks a name as missing.
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
   * initial bundle for every screen that never opens a user picker.
   */
  createUser(options: DirectoryQueryOptions): Observable<PrincipalOption | null> {
    const valueField = resolveValueField(options.valueField, userValueFields, 'username');

    return from(import('app/pages/credentials/users/user-form/user-form.component')).pipe(
      switchMap((module) => this.formPanel.open(module.UserFormComponent, {
        wide: true,
        title: this.translate.instant('Add User'),
      })),
      map(({ response }) => (response
        ? toOption(response.username, response[valueField])
        : null)),
    );
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

    return this.api.call('user.query', [filters, { ...baseOptions, offset, limit: directoryPageSize }]);
  }
}

/**
 * Usernames and group names are data, not copy — `ignoreTranslation` keeps them
 * out of the extracted string catalogue while satisfying `TranslatedString`.
 */
function toOption(label: string, value: PrincipalValue): PrincipalOption {
  return { label: ignoreTranslation(label), value };
}

/**
 * The requested value field, when it is one this kind of record actually has.
 *
 * `valueField` is one input shared by user and group fields, so nothing stops a
 * user picker asking for `gid`. Reading it off a `User` would give `undefined`
 * and commit that as the value; falling back to the name at least commits
 * something the API accepts.
 */
function resolveValueField<T extends string>(
  requested: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((field) => field === requested) ?? fallback;
}

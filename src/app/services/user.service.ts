import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DsUncachedGroup, DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Group } from 'app/interfaces/group.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  protected api = inject(ApiService);

  static readonly namePattern = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*[$]?$/;
  protected uncachedUserQuery = 'user.get_user_obj' as const;
  protected uncachedGroupQuery = 'group.get_group_obj' as const;
  protected userQuery = 'user.query' as const;
  protected groupQuery = 'group.query' as const;
  protected queryOptions = { limit: 50 };

  // Cache of usernames and group names from recent autocomplete queries.
  // Used to avoid redundant existence checks when values are already known from autocomplete.
  private autocompleteUserCache = new Set<string>();
  private autocompleteGroupCache = new Set<string>();

  // Cache of users/groups that have been verified to NOT exist.
  // Prevents repeated API calls for the same non-existent values.
  private nonExistentUserCache = new Set<string>();
  private nonExistentGroupCache = new Set<string>();

  private readonly AUTOCOMPLETE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private autocompleteCacheTimestamp = 0;

  groupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<Group>[] = [];

    if (trimmedSearch) {
      queryArgs.push(['group', '~', `(?i).*${trimmedSearch.replaceAll('\\', '\\\\')}`]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }

    return this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]).pipe(
      map((groups) => {
        this.updateAutocompleteCache();
        groups.forEach((group) => this.autocompleteGroupCache.add(group.group));
        return groups;
      }),
    );
  }

  smbGroupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<Group>[] = [['smb', '=', true]];

    if (trimmedSearch) {
      // Escape backslashes for domain-prefixed group names (e.g., "ACME\Domain Admins")
      queryArgs.push(['group', '^', trimmedSearch.replaceAll('\\', '\\\\')]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }

    return this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]).pipe(
      map((groups) => {
        this.updateAutocompleteCache();
        groups.forEach((group) => this.autocompleteGroupCache.add(group.group));
        return groups;
      }),
    );
  }

  /**
   * Gets a group by exact name match using the uncached API.
   * @deprecated Use getGroupByNameCached() instead to populate the directory services cache.
   */
  getGroupByName(groupname: string): Observable<DsUncachedGroup> {
    return this.api.call(this.uncachedGroupQuery, [{ groupname }]);
  }

  /**
   * Gets a group by exact name match using the cached query API.
   *
   * This method inserts the result into the middleware directory services cache,
   * reducing subsequent lookups across the UI. The cache is middleware-managed and
   * persists for the duration of the middleware session.
   *
   * Use this instead of getGroupByName() to improve performance when validating
   * group names in forms or displaying group information.
   *
   * @param groupname - Exact group name to look up
   * @returns Observable of the group object
   *
   * Note: The `as unknown as Observable<Group>` cast is required because the API's
   * type system doesn't distinguish between array and single-object returns when get: true.
   */
  getGroupByNameCached(groupname: string): Observable<Group> {
    const queryArgs: QueryFilter<Group>[] = [['name', '=', groupname]];
    return this.api.call(this.groupQuery, [queryArgs, { get: true }]) as unknown as Observable<Group>;
  }

  /**
   * Queries directory service users with case-insensitive regex search.
   * Handles domain-prefixed usernames (e.g., "ACME\admin") by escaping backslashes in the regex.
   *
   * @param search - Username or pattern to search for
   * @param offset - Pagination offset for results
   * @returns Observable of users matching the search pattern
   */
  userQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<User>[] = [];

    if (trimmedSearch) {
      queryArgs.push(['username', '~', `(?i).*${trimmedSearch.replaceAll('\\', '\\\\')}`]);
    }

    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]).pipe(
      map((users) => {
        this.updateAutocompleteCache();
        users.forEach((user) => this.autocompleteUserCache.add(user.username));
        return users;
      }),
    );
  }

  /**
   * Gets a user by exact name match using the uncached API.
   * @deprecated Use getUserByNameCached() instead to populate the directory services cache.
   */
  getUserByName(username: string): Observable<DsUncachedUser> {
    return this.api.call(this.uncachedUserQuery, [{ username }]);
  }

  /**
   * Gets a user by exact name match using the cached query API.
   *
   * This method inserts the result into the middleware directory services cache,
   * reducing subsequent lookups across the UI. The cache is middleware-managed and
   * persists for the duration of the middleware session.
   *
   * Use this instead of getUserByName() to improve performance when validating
   * usernames in forms or displaying user information.
   *
   * @param username - Exact username to look up
   * @returns Observable of the user object
   *
   * Note: The `as unknown as Observable<User>` cast is required because the API's
   * type system doesn't distinguish between array and single-object returns when get: true.
   */
  getUserByNameCached(username: string): Observable<User> {
    const queryArgs: QueryFilter<User>[] = [['username', '=', username]];
    return this.api.call(this.userQuery, [queryArgs, { get: true }]) as unknown as Observable<User>;
  }

  /**
   * Queries SMB users with prefix matching.
   * Handles domain-prefixed usernames (e.g., "ACME\admin") by escaping backslashes.
   *
   * @param search - Username or pattern to search for
   * @param offset - Pagination offset for results
   * @returns Observable of SMB users matching the prefix
   */
  smbUserQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<User>[] = [['smb', '=', true]];
    if (trimmedSearch) {
      // Escape backslashes for domain-prefixed usernames (e.g., "ACME\admin")
      queryArgs.push(['username', '^', trimmedSearch.replaceAll('\\', '\\\\')]);
    }

    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]).pipe(
      map((users) => {
        this.updateAutocompleteCache();
        users.forEach((user) => this.autocompleteUserCache.add(user.username));
        return users;
      }),
    );
  }

  /**
   * Checks if a username exists in the autocomplete cache.
   * Returns true if the user was recently fetched via autocomplete, avoiding redundant API calls.
   */
  isUserInAutocompleteCache(username: string): boolean {
    if (Date.now() - this.autocompleteCacheTimestamp > this.AUTOCOMPLETE_CACHE_TTL) {
      return false; // Cache expired
    }
    return this.autocompleteUserCache.has(username);
  }

  /**
   * Checks if a group name exists in the autocomplete cache.
   * Returns true if the group was recently fetched via autocomplete, avoiding redundant API calls.
   */
  isGroupInAutocompleteCache(groupName: string): boolean {
    if (Date.now() - this.autocompleteCacheTimestamp > this.AUTOCOMPLETE_CACHE_TTL) {
      return false; // Cache expired
    }
    return this.autocompleteGroupCache.has(groupName);
  }

  /**
   * Checks if a username is cached as non-existent.
   * Returns true if we've already verified this user doesn't exist, avoiding redundant API calls.
   */
  isUserCachedAsNonExistent(username: string): boolean {
    if (Date.now() - this.autocompleteCacheTimestamp > this.AUTOCOMPLETE_CACHE_TTL) {
      return false; // Cache expired
    }
    return this.nonExistentUserCache.has(username);
  }

  /**
   * Checks if a group name is cached as non-existent.
   * Returns true if we've already verified this group doesn't exist, avoiding redundant API calls.
   */
  isGroupCachedAsNonExistent(groupName: string): boolean {
    if (Date.now() - this.autocompleteCacheTimestamp > this.AUTOCOMPLETE_CACHE_TTL) {
      return false; // Cache expired
    }
    return this.nonExistentGroupCache.has(groupName);
  }

  /**
   * Records a username as non-existent to avoid repeated API calls.
   */
  recordUserAsNonExistent(username: string): void {
    this.updateAutocompleteCache();
    this.nonExistentUserCache.add(username);
  }

  /**
   * Records a group name as non-existent to avoid repeated API calls.
   */
  recordGroupAsNonExistent(groupName: string): void {
    this.updateAutocompleteCache();
    this.nonExistentGroupCache.add(groupName);
  }

  /**
   * Updates the autocomplete cache timestamp and clears old cache if expired.
   */
  private updateAutocompleteCache(): void {
    const now = Date.now();
    if (now - this.autocompleteCacheTimestamp > this.AUTOCOMPLETE_CACHE_TTL) {
      // Cache expired, clear it
      this.autocompleteUserCache.clear();
      this.autocompleteGroupCache.clear();
      this.nonExistentUserCache.clear();
      this.nonExistentGroupCache.clear();
    }
    this.autocompleteCacheTimestamp = now;
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

  groupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<Group>[] = [];

    if (trimmedSearch) {
      queryArgs.push(['group', '~', `(?i).*${trimmedSearch.replaceAll('\\', '\\\\')}`]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }

    return this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
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

    return this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
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
   * This method has the advantage of inserting into the directory services cache on positive result.
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

    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
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
   * This method has the advantage of inserting into the directory services cache on positive result.
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

    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
  }
}

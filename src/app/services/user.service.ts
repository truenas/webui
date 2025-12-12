import { Injectable, inject } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DsUncachedGroup, DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Group } from 'app/interfaces/group.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';

// TODO: Clean up this service.
@Injectable({ providedIn: 'root' })
export class UserService {
  protected api = inject(ApiService);

  static readonly namePattern = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*[$]?$/;
  protected uncachedUserQuery = 'user.get_user_obj' as const;
  protected uncachedGroupQuery = 'group.get_group_obj' as const;
  protected userQuery = 'user.query' as const;
  protected groupQuery = 'group.query' as const;
  protected queryOptions = { limit: 50 };

  private groupQueryDsCacheByName(name: string): Observable<Group[]> {
    if (!name?.length) {
      return of([]);
    }
    let queryArgs: QueryFilter<Group>[] = [];
    name = name.trim();
    if (name.length > 0) {
      queryArgs = [['name', '=', name]];
    }
    return this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions }]);
  }

  groupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    let queryArgs: QueryFilter<Group>[] = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [['group', '~', `(?i).*${search.replaceAll('\\', '\\\\')}`]];
    }
    if (hideBuiltIn) {
      queryArgs = queryArgs.concat([['builtin', '=', false]]);
    }
    return combineLatest([
      this.groupQueryDsCacheByName(search),
      this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
    ]).pipe(map(([groupSearchedByName, groups]) => {
      const groupIds = groupSearchedByName.map((groupsByName) => groupsByName.id);
      groups = groups.filter(
        (group) => {
          return !groupIds.some((gid) => gid === group.id);
        },
      );
      return [...groups, ...groupSearchedByName];
    }));
  }

  smbGroupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    const trimmedSearch = search?.trim() || '';
    const queryArgs: QueryFilter<Group>[] = [['smb', '=', true]];

    if (trimmedSearch) {
      // Escape backslashes for domain-prefixed group names (e.g., "ACME\Domain Admins")
      queryArgs.push(['group', '^', trimmedSearch.replaceAll('\\', '\\\\')]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }
    return combineLatest([
      this.groupQueryDsCacheByName(search),
      this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
    ]).pipe(map(([groupSearchedByName, groups]) => {
      const groupIds = groupSearchedByName.map((groupsByName) => groupsByName.id);
      groups = groups.filter(
        (group) => {
          return !groupIds.some((gid) => gid === group.id);
        },
      );
      return [...groups, ...groupSearchedByName];
    }));
  }

  getGroupByName(groupname: string): Observable<DsUncachedGroup> {
    return this.api.call(this.uncachedGroupQuery, [{ groupname }]);
  }

  private userQueryDsCacheByName(name: string): Observable<User[]> {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return of([]);
    }
    const queryArgs: QueryFilter<User>[] = [['username', '=', trimmedName]];
    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions }]);
  }

  /**
   * Queries directory service users with enhanced search capabilities.
   *
   * Uses a dual-search strategy:
   * 1. Exact name match - for finding specific users quickly
   * 2. Case-insensitive regex - for broader pattern matching with proper backslash escaping
   *
   * Handles domain-prefixed usernames (e.g., "ACME\admin") by escaping backslashes in the regex.
   *
   * @param search - Username or pattern to search for
   * @param offset - Pagination offset for regex results
   * @returns Observable of users, with exact matches appearing LAST for display prioritization
   */
  userQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<User>[] = [];

    if (trimmedSearch) {
      queryArgs.push(['username', '~', `(?i).*${trimmedSearch.replaceAll('\\', '\\\\')}`]);
    }

    return combineLatest([
      this.userQueryDsCacheByName(trimmedSearch),
      this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
    ]).pipe(map(([userSearchedByName, users]) => {
      const userIds = new Set(userSearchedByName.map((user) => user.id));
      const filteredUsers = users.filter((user) => !userIds.has(user.id));
      // Exact match comes last for better display prioritization
      return [...filteredUsers, ...userSearchedByName];
    }));
  }

  getUserByName(username: string): Observable<DsUncachedUser> {
    return this.api.call(this.uncachedUserQuery, [{ username }]);
  }

  /**
   * Queries SMB users with enhanced search capabilities.
   *
   * Uses a dual-search strategy:
   * 1. Exact name match - for finding specific users quickly
   * 2. Prefix match - for finding users that start with the search term
   *
   * Handles domain-prefixed usernames (e.g., "ACME\admin") by escaping backslashes.
   *
   * @param search - Username or pattern to search for
   * @param offset - Pagination offset for prefix match results
   * @returns Observable of SMB users, with exact matches appearing LAST for display prioritization
   */
  smbUserQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const trimmedSearch = search?.trim() || '';
    const queryArgs: QueryFilter<User>[] = [['smb', '=', true]];
    if (trimmedSearch) {
      // Escape backslashes for domain-prefixed usernames (e.g., "ACME\admin")
      queryArgs.push(['username', '^', trimmedSearch.replaceAll('\\', '\\\\')]);
    }

    return combineLatest([
      this.userQueryDsCacheByName(trimmedSearch),
      this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
    ]).pipe(map(([userSearchedByName, users]) => {
      const userIds = new Set(userSearchedByName.map((user) => user.id));
      const filteredUsers = users.filter((user) => !userIds.has(user.id));
      // Exact match comes last for better display prioritization
      return [...filteredUsers, ...userSearchedByName];
    }));
  }
}

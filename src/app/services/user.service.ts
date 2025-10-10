import { Injectable, inject } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
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

  private groupQueryDsCacheByName(name: string): Observable<Group[]> {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return of([]);
    }
    const queryArgs: QueryFilter<Group>[] = [['name', '=', trimmedName]];
    return this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions }]);
  }

  groupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<Group>[] = [];

    if (trimmedSearch) {
      queryArgs.push(['group', '~', `(?i).*${trimmedSearch.replaceAll('\\', '\\\\')}`]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }

    return combineLatest([
      this.groupQueryDsCacheByName(trimmedSearch),
      this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
    ]).pipe(map(([groupSearchedByName, groups]) => {
      const groupIds = new Set(groupSearchedByName.map((group) => group.id));
      const filteredGroups = groups.filter((group) => !groupIds.has(group.id));
      return [...filteredGroups, ...groupSearchedByName];
    }));
  }

  smbGroupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<Group>[] = [['smb', '=', true]];

    if (trimmedSearch) {
      queryArgs.push(['group', '^', trimmedSearch]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }

    return combineLatest([
      this.groupQueryDsCacheByName(trimmedSearch),
      this.api.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
    ]).pipe(map(([groupSearchedByName, groups]) => {
      const groupIds = new Set(groupSearchedByName.map((group) => group.id));
      const filteredGroups = groups.filter((group) => !groupIds.has(group.id));
      return [...filteredGroups, ...groupSearchedByName];
    }));
  }

  getGroupByName(groupname: string): Observable<DsUncachedGroup> {
    return this.api.call(this.uncachedGroupQuery, [{ groupname }]);
  }

  userQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<User>[] = trimmedSearch ? [['username', '^', trimmedSearch]] : [];
    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
  }

  getUserByName(username: string): Observable<DsUncachedUser> {
    return this.api.call(this.uncachedUserQuery, [{ username }]);
  }

  smbUserQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const trimmedSearch = search.trim();
    const queryArgs: QueryFilter<User>[] = [['smb', '=', true]];
    if (trimmedSearch) {
      queryArgs.push(['username', '^', trimmedSearch]);
    }
    return this.api.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
  }
}

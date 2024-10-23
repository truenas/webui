import { Injectable } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DsUncachedGroup, DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Group } from 'app/interfaces/group.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  static readonly namePattern = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*[$]?$/;
  protected uncachedUserQuery = 'user.get_user_obj' as const;
  protected uncachedGroupQuery = 'group.get_group_obj' as const;
  protected userQuery = 'user.query' as const;
  protected groupQuery = 'group.query' as const;
  protected queryOptions = { limit: 50 };

  constructor(protected ws: WebSocketService) {}

  private groupQueryDsCacheByName(name: string): Observable<Group[]> {
    if (!name?.length) {
      return of([]);
    }
    let queryArgs: QueryFilter<Group>[] = [];
    name = name.trim();
    if (name.length > 0) {
      queryArgs = [['name', '=', name]];
    }
    return this.ws.call(this.groupQuery, [queryArgs, { ...this.queryOptions }]);
  }

  groupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    let queryArgs: QueryFilter<Group>[] = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [['group', '^', search]];
    }
    if (hideBuiltIn) {
      queryArgs = queryArgs.concat([['builtin', '=', false]]);
    }
    return combineLatest([
      this.groupQueryDsCacheByName(search),
      this.ws.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
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
    const queryArgs: QueryFilter<Group>[] = [['smb', '=', true]];
    search = search.trim();
    if (search.length > 0) {
      queryArgs.push(['group', '^', search]);
    }
    if (hideBuiltIn) {
      queryArgs.push(['builtin', '=', false]);
    }
    return combineLatest([
      this.groupQueryDsCacheByName(search),
      this.ws.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]),
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
    return this.ws.call(this.uncachedGroupQuery, [{ groupname }]);
  }

  userQueryDsCache(search = '', offset = 0): Observable<User[]> {
    let queryArgs: QueryFilter<User>[] = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [['username', '^', search]];
    }
    return this.ws.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
  }

  getUserByName(username: string): Observable<DsUncachedUser> {
    return this.ws.call(this.uncachedUserQuery, [{ username }]);
  }

  smbUserQueryDsCache(search = '', offset = 0): Observable<User[]> {
    const queryArgs: QueryFilter<User>[] = [['smb', '=', true]];
    search = search.trim();
    if (search.length > 0) {
      queryArgs.push(['username', '^', search]);
    }
    return this.ws.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset, order_by: ['builtin'] }]);
  }
}

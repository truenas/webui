import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DsUncachedGroup, DsUncachedUser } from 'app/interfaces/ds-cache.interface';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  static VALIDATOR_NAME = /^[a-zA-Z0-9_][a-zA-Z0-9_\.-]*[$]?$/;
  protected uncachedUserQuery = 'dscache.get_uncached_user' as const;
  protected uncachedGroupQuery = 'dscache.get_uncached_group' as const;
  protected userQuery = 'user.query' as const;
  protected groupQuery = 'group.query' as const;
  protected queryOptions = { extra: { search_dscache: true }, limit: 50 };

  constructor(protected ws: WebSocketService) {}

  groupQueryDsCache(search = '', hideBuiltIn = false, offset = 0): Observable<Group[]> {
    // TODO: Proper type for query API.
    let queryArgs: any[] = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [['group', '^', search]];
    }
    if (hideBuiltIn) {
      queryArgs = queryArgs.concat([['builtin', '=', false]]);
    }
    return this.ws.call(this.groupQuery, [queryArgs, { ...this.queryOptions, offset }]);
  }

  getGroupByGid(gid: string): Observable<Group[]> {
    return this.ws.call(this.groupQuery, [[['gid', '=', gid]], this.queryOptions]);
  }

  getGroupByName(group: string): Observable<DsUncachedGroup> {
    return this.ws.call(this.uncachedGroupQuery, [group]);
  }

  userQueryDsCache(search = '', offset = 0): Observable<User[]> {
    let queryArgs: QueryFilter<User>[] = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [['username', '^', search]];
    }
    return this.ws.call(this.userQuery, [queryArgs, { ...this.queryOptions, offset }]);
  }

  getUserByUid(uid: string): Observable<User[]> {
    return this.ws.call(this.userQuery, [[['uid', '=', uid]], this.queryOptions]);
  }

  getUserByName(username: string): Observable<DsUncachedUser> {
    return this.ws.call(this.uncachedUserQuery, [username]);
  }

  async getUserObject(userId: string | number): Promise<DsUncachedUser> {
    let user;
    await this.ws
      .call('user.get_user_obj', [typeof userId === 'string' ? { username: userId } : { uid: userId }])
      .toPromise()
      .then((u) => (user = u), console.error);
    return user;
  }

  async getGroupObject(groupId: string | number): Promise<DsUncachedGroup> {
    let group;
    await this.ws
      .call('group.get_group_obj', [typeof groupId === 'string' ? { groupname: groupId } : { gid: groupId }])
      .toPromise()
      .then((g) => (group = g), console.error);
    return group;
  }

  async shellChoices(userId?: number): Promise<Option[]> {
    return this.ws
      .call('user.shell_choices', userId ? [userId] : [])
      .pipe(
        map((choices) => {
          return Object.keys(choices || {}).map((key) => ({
            label: choices[key],
            value: key,
          }));
        }),
      )
      .toPromise();
  }
}

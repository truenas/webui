

import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class UserService {
  public static VALIDATOR_NAME = /^[a-zA-Z0-9_][a-zA-Z0-9_\.-]*[$]?$/;
  protected uncachedUserQuery = 'dscache.get_uncached_user';
  protected uncachedGroupQuery = 'dscache.get_uncached_group';
  protected userQuery = 'user.query';
  protected groupQuery = 'group.query';
  protected queryOptions = {'extra': {'search_dscache':true}, 'limit': 50};

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  listUsers() { return this.ws.call(this.userQuery, {limit: 50}); };

  listGroups() { return this.ws.call(this.groupQuery, {limit: 50}); };
  
  groupQueryDSCache(search = "", hideBuiltIn = false, offset = 0) {
    let queryArgs = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [["group", "^", search]];
    }
    if (hideBuiltIn) {
      queryArgs = queryArgs.concat([["builtin", "=", false]]);
    }
    return this.ws.call(this.groupQuery, [queryArgs, {...this.queryOptions, offset}]);
  }
  
  getGroupByGID(gid) {
    return this.ws.call(this.groupQuery, [[["gid", "=", gid]], this.queryOptions]);
  }

  getGroupByName(group) {
    return this.ws.call(this.uncachedGroupQuery, [group]);
  }

  userQueryDSCache(search = "", offset = 0) {
    let queryArgs = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [["username", "^", search]];
    }
    return this.ws.call(this.userQuery, [queryArgs, {...this.queryOptions, offset}]);
  }

  getUserByUID(uid) {
    return this.ws.call(this.userQuery, [[["uid", "=", uid]], this.queryOptions]);
  }

  getUserByName(username) {
    return this.ws.call(this.uncachedUserQuery, [username]);
  }

  async getUserObject(userId: string | number) {
    let user;
    await this.ws
      .call('user.get_user_obj', [typeof userId === 'string' ? { username: userId } : { uid: userId }])
      .toPromise()
      .then(u => (user = u), console.error);
    return user;
  }

  async getGroupObject(groupId: string | number) {
    let group;
    await this.ws
      .call('group.get_group_obj', [typeof groupId === 'string' ? { groupname: groupId } : { gid: groupId }])
      .toPromise()
      .then(g => (group = g), console.error);
    return group;
  }

  async shellChoices(userId?: number): Promise<{ label: string, value: string}[]> {
    return await this.ws
      .call("user.shell_choices", userId ? [userId] : [])
      .pipe(
        map(choices =>
          Object.keys(choices || {}).map(key => ({
            label: choices[key],
            value: key
          }))
        )
      )
      .toPromise();
  }
}

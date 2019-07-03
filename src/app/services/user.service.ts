

import {Injectable} from '@angular/core';
import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

@Injectable()
export class UserService {
  public static VALIDATOR_NAME = /^[a-zA-Z_][a-zA-Z0-9_\.-]*[$]?$/;

  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';
  protected uncachedUserQuery = 'dscache.get_uncached_user';
  protected uncachedGroupQuery = 'dscache.get_uncached_group';
  protected userQuery = 'user.query';
  protected groupQuery = 'group.query';
  protected queryOptions = {'extra': {'search_dscache':true}, 'limit': 50};

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  listUsers() { return this.rest.get(this.accountUserResource, {limit: 50}); };

  listGroups() { return this.rest.get(this.accountGroupResource, {limit: 50}); };
  
  groupQueryDSCache(search = "") {
    let queryArgs = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [["group", "^", search]];
    }
    return this.ws.call(this.groupQuery, [queryArgs, this.queryOptions]);
  }
  
  getGroupByGID(gid) {
    return this.ws.call(this.groupQuery, [[["gid", "=", gid]], this.queryOptions]);
  }

  getGroupByName(group) {
    return this.ws.call(this.uncachedGroupQuery, [group]);
  }

  userQueryDSCache(search = "") {
    let queryArgs = [];
    search = search.trim();
    if (search.length > 0) {
      queryArgs = [["username", "^", search]];
    }
    return this.ws.call(this.userQuery, [queryArgs, this.queryOptions]);
  }

  getUserByUID(uid) {
    return this.ws.call(this.userQuery, [[["uid", "=", uid]], this.queryOptions]);
  }

  getUserByName(username) {
    return this.ws.call(this.uncachedUserQuery, [username]);
  }
}

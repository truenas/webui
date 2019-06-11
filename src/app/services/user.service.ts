

import {Injectable} from '@angular/core';
import {RestService} from './rest.service';

@Injectable()
export class UserService {
  public static VALIDATOR_NAME = /^[a-zA-Z_][a-zA-Z0-9_\.-]*[$]?$/;

  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';

  constructor(protected rest: RestService) {};

  listUsers() { return this.rest.get(this.accountUserResource, {limit: 50}); };

  listGroups() { return this.rest.get(this.accountGroupResource, {limit: 50}); };
  
  listAllUsers(search = "", offset: number = 0) { 
    let resource = this.accountAllUsersResource;
    if (search) {
      resource = resource + '?q=' + search;
    }
    return this.rest.get(resource,
            {offset: offset, limit: 50}) };

  listAllGroups(search = "", offset: number = 0) { 
    let resource = this.accountAllGroupsResource;
    if (search) {
      resource = resource + '?q=' + search;
    }
    return this.rest.get(resource,
            {offset: offset, limit: 50}) };
}

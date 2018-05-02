import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

@Injectable()
export class UserService {
  protected accountUserResource: string = 'account/users/';
  protected accountGroupResource: string = 'account/groups/';
  protected accountAllUsersResource: string = 'account/all_users/';
  protected accountAllGroupsResource: string = 'account/all_groups/';

  constructor(protected rest: RestService) {};

  listUsers() { return this.rest.get(this.accountUserResource, {limit: 50}); };

  listGroups() { return this.rest.get(this.accountGroupResource, {limit: 50}); };
  
  listAllUsers(offset: number = 0) { 
    return this.rest.get(this.accountAllUsersResource,
            {offset: offset, limit: 50}) };

  listAllGroups(offset: number = 0) { 
    return this.rest.get(this.accountAllGroupsResource,
            {offset: offset, limit: 50}) };
}

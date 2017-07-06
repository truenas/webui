import {Component, ElementRef, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {GlobalState} from '../../../global.state';
import {RestService} from '../../../services/rest.service';

import {EntityListComponent} from '../../common/entity/entity-list/index';

@Component({
  selector : 'app-group-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class GroupListComponent {

  protected resource_name: string = 'account/groups/';
  protected route_add: string[] = [ 'groups', 'add' ];
  protected route_edit: string[] = [ 'groups', 'edit' ];
  protected route_delete: string[] = [ 'groups', 'delete' ];

  public columns: Array<any> = [
    {name : 'Group', prop : 'bsdgrp_group'},
    {name : 'GID', prop : 'bsdgrp_gid'},
    {name : 'Builtin', prop : 'bsdgrp_builtin'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.bsdgrp_builtin === true) {
      return false;
    }
    return true;
  }
}

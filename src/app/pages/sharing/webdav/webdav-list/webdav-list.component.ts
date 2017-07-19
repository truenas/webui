import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'webdav-list',
  template : `<entity-table [conf]="this"></entity-table>`
})

export class WebdavListComponent {
    protected resource_name: string = 'sharing/webdav';
    public busy: Subscription;
    public sub: Subscription;

    protected route_add: string[] = [ 'sharing', 'webdav', 'add' ];
    protected route_edit: string[] = [ 'sharing', 'webdav', 'edit'];
    protected route_delete: string[] = [ 'sharing', 'webdav', 'delete'];

    public columns: Array<any> = [
        {prop: 'webdav_name', name: 'Share Name'},
        {prop: 'webdav_comment', name: 'Comment'},
        {prop: 'webdav_path', name: 'Path'},
        {prop: 'webdav_ro', name: 'Read Only'},
        {prop: 'webdav_perm', name: 'Change User & Group Ownership'},
    ];

    public config: any = {
        paging : true,
        sorting : {columns : this.columns},
    };

}


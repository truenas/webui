import { ApplicationRef, Component, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { T } from '../../../../translate-marker';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector : 'webdav-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})

export class WebdavListComponent {

    public title = "WebDAV";
    protected resource_name: string = 'sharing/webdav';
    public busy: Subscription;
    public sub: Subscription;

    protected route_add: string[] = [ 'sharing', 'webdav', 'add' ];
    protected route_add_tooltip: string = "Add WebDAV Share";
    protected route_edit: string[] = [ 'sharing', 'webdav', 'edit'];
    protected route_delete: string[] = [ 'sharing', 'webdav', 'delete'];

    public columns: Array<any> = [
        {prop: 'webdav_name', name: T('Share Name')},
        {prop: 'webdav_comment', name: T('Comment')},
        {prop: 'webdav_path', name: T('Path')},
        {prop: 'webdav_ro', name: T('Read Only')},
        {prop: 'webdav_perm', name: T('Change User & Group Ownership')},
    ];

    public config: any = {
        paging : true,
        sorting : {columns : this.columns},
    };

}


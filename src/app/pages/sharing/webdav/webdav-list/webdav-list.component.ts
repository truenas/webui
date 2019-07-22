import { Component, } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { helptext_sharing_webdav } from 'app/helptext/sharing';

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
        {prop: 'webdav_name', name: helptext_sharing_webdav.column_name, always_display: true },
        {prop: 'webdav_comment', name: helptext_sharing_webdav.column_comment},
        {prop: 'webdav_path', name:  helptext_sharing_webdav.column_path},
        {prop: 'webdav_ro', name:  helptext_sharing_webdav.column_ro},
        {prop: 'webdav_perm', name:  helptext_sharing_webdav.column_perm},
    ];

    public config: any = {
        paging : true,
        sorting : {columns : this.columns},
        deleteMsg: {
            title: 'WebDAV Share',
            key_props: ['webdav_name']
        },
    };

}


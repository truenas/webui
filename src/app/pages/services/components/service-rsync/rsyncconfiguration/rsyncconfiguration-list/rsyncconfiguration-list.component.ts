import { Component, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector : 'app-rsync-module-list',
    template : `<entity-table [title]="title" [conf]="this"></entity-table>`
  })
  export class RSYNCconfigurationListComponent {
    public title = "RSYNC Modules";
    protected queryCall = 'rsyncmod.query';
    protected entityList: any;
    public busy: Subscription;
    public wsDelete = 'rsyncmod.delete'
    protected route_add: string[] = ['services', 'rsync','rsync-module','add' ];
    protected route_edit: string[] = ['services', 'rsync','rsync-module','edit' ];
    protected route_delete: string[] = ['services', 'rsync','rsync-module','delete' ];

    public columns: Array<any> = [
        { name: 'Name', prop: 'name' },
        { name: 'Comment', prop: 'comment' },    
        { name: 'Path', prop: 'path' },
        { name: 'Mode', prop: 'mode' },
        { name: 'Maximum connections', prop: 'maxconn' },
        { name: 'User', prop: 'user' },
        { name: 'Group', prop: 'group' },
        { name: 'Host Allow', prop: 'hostsallow' },
        { name: 'Host Deny', prop: 'hostsdeny' },
        { name: 'Auxiliary parameters', prop: 'auxiliary' },
      ];
    public config: any = {
    paging : true,
    sorting : { columns : this.columns },
    };
  
  }
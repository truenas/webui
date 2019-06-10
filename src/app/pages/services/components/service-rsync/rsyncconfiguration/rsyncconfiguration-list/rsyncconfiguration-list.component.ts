import { Component, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { T } from '../../../../../../translate-marker';

@Component({
    selector : 'app-rsync-module-list',
    template : `<entity-table [title]="title" [conf]="this"></entity-table>`
  })
  export class RSYNCconfigurationListComponent {
    public title = "RSYNC Modules";
    protected queryCall = 'rsyncmod.query';
    protected hasDetails = true;
    protected entityList: any;
    public busy: Subscription;
    public wsDelete = 'rsyncmod.delete'
    protected route_add: string[] = ['services', 'rsync','rsync-module','add' ];
    protected route_edit: string[] = ['services', 'rsync','rsync-module','edit' ];
    protected route_delete: string[] = ['services', 'rsync','rsync-module','delete' ];

    public columns: Array<any> = [
        { name: T('Name'), prop: 'name' },
        { name: T('Comment'), prop: 'comment' },    
        { name: T('Path'), prop: 'path' },
        { name: T('Mode'), prop: 'mode' },
        { name: T('Maximum connections'), prop: 'maxconn', hidden: true },
        { name: T('User'), prop: 'user' },
        { name: T('Group'), prop: 'group' },
        { name: T('Host Allow'), prop: 'hostsallow', hidden: true },
        { name: T('Host Deny'), prop: 'hostsdeny', hidden: true },
        { name: T('Auxiliary parameters'), prop: 'auxiliary', hidden: true }
      ];
    public config: any = {
    paging : true,
    sorting : { columns : this.columns },
    };

    dataHandler(res) {
      const rows = res.rows;
      for (let i=0; i<rows.length; i++) {
        rows[i].details = [];
        rows[i].details.push({label: T("Maximum connections"), value:rows[i]["maxconn"]},
                             {label: T("Host Allow"), value:rows[i]["hostsallow"]},
                             {label: T("Host Deny"), value:rows[i]["hostsdeny"]},
                             {label: T("Auxilliary parameters"), value:rows[i]["auxiliary"]}
        );
      }
      
    }
  }
import { Component } from '@angular/core';
import { EntityTableComponent, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';

import { helptext_sharing_webdav } from 'app/helptext/sharing';
import { DialogService, ModalService, WebSocketService } from 'app/services';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'webdav-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class WebdavListComponent implements InputTableConf {
  title = 'WebDAV';
  queryCall: 'sharing.webdav.query' = 'sharing.webdav.query';
  wsDelete: 'sharing.webdav.delete' = 'sharing.webdav.delete';
  route_delete: string[] = ['sharing', 'webdav', 'delete'];
  rowIdentifier = helptext_sharing_webdav.column_name;

  columns: any[] = [
    { prop: 'name', name: helptext_sharing_webdav.column_name, always_display: true },
    { prop: 'comment', name: helptext_sharing_webdav.column_comment },
    { prop: 'path', name: helptext_sharing_webdav.column_path },
    { prop: 'enabled', name: helptext_sharing_webdav.column_enabled },
    { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
    { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
  ];

  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'WebDAV Share',
      key_props: ['name'],
    },
  };

  constructor(private modalService: ModalService, private router: Router, private ws: WebSocketService, private dialog: DialogService) {}

  doAdd(id: any, tableComponent: EntityTableComponent): void {
    this.modalService.open('slide-in-form', new WebdavFormComponent(this.router, this.ws, this.dialog));
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      tableComponent.getData();
    });
  }

  doEdit(rowId: string, tableComponent: EntityTableComponent): void {
    this.modalService.open('slide-in-form', new WebdavFormComponent(this.router, this.ws, this.dialog), rowId);
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      tableComponent.getData();
    });
  }
}

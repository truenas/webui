import { Component } from '@angular/core';
import { EntityTableComponent, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { Subscription } from 'rxjs';

import { helptext_sharing_webdav } from 'app/helptext/sharing';
import {
  AppLoaderService, DialogService, ModalService, WebSocketService,
} from 'app/services';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form';
import { Router } from '@angular/router';

@Component({
  selector: 'webdav-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class WebdavListComponent implements InputTableConf {
  title = 'WebDAV';
  queryCall: 'sharing.webdav.query' = 'sharing.webdav.query';
  wsDelete: 'sharing.webdav.delete' = 'sharing.webdav.delete';
  busy: Subscription;
  sub: Subscription;
  addSubscription: Subscription;
  editSubscription: Subscription;
  constructor(
    private modalService: ModalService,
    private router: Router,
    private ws: WebSocketService,
    private dialog: DialogService,
    private loader: AppLoaderService,
  ) {}

  protected route_delete: string[] = ['sharing', 'webdav', 'delete'];

  columns: any[] = [
    { prop: 'name', name: helptext_sharing_webdav.column_name, always_display: true },
    { prop: 'comment', name: helptext_sharing_webdav.column_comment },
    { prop: 'path', name: helptext_sharing_webdav.column_path },
    { prop: 'enabled', name: helptext_sharing_webdav.column_enabled },
    { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
    { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
  ];
  rowIdentifier = helptext_sharing_webdav.column_name;

  doAdd(id: any, tableComponent: EntityTableComponent): void {
    this.modalService.open('slide-in-form', new WebdavFormComponent(this.router, this.ws, this.dialog, this.loader));
    this.addSubscription = this.modalService.onClose$.subscribe(() => {
      tableComponent.getData();
    });
  }

  doEdit(rowId: string, tableComponent: EntityTableComponent): void {
    this.modalService.open('slide-in-form', new WebdavFormComponent(this.router, this.ws, this.dialog, this.loader), rowId);
    this.editSubscription = this.modalService.onClose$.subscribe(() => {
      tableComponent.getData();
    });
  }

  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'WebDAV Share',
      key_props: ['name'],
    },
  };

  ngOnDestroy(): void {
    if (this.addSubscription) {
      this.addSubscription.unsubscribe();
    }

    if (this.editSubscription) {
      this.editSubscription.unsubscribe();
    }
  }
}

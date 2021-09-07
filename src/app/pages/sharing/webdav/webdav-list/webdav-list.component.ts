import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptext_sharing_webdav } from 'app/helptext/sharing';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form/webdav-form.component';
import {
  AppLoaderService, DialogService, ModalService, WebSocketService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'webdav-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class WebdavListComponent implements EntityTableConfig {
  title = 'WebDAV';
  queryCall: 'sharing.webdav.query' = 'sharing.webdav.query';
  wsDelete: 'sharing.webdav.delete' = 'sharing.webdav.delete';
  route_delete: string[] = ['sharing', 'webdav', 'delete'];
  rowIdentifier = helptext_sharing_webdav.column_name;

  columns = [
    { prop: 'name', name: helptext_sharing_webdav.column_name, always_display: true },
    { prop: 'comment', name: helptext_sharing_webdav.column_comment },
    { prop: 'path', name: helptext_sharing_webdav.column_path },
    { prop: 'enabled', name: helptext_sharing_webdav.column_enabled },
    { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
    { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
  ];

  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Webdav',
      key_props: ['name'],
    },
  };

  constructor(
    private modalService: ModalService,
    private router: Router,
    private ws: WebSocketService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
  ) {}

  doAdd(id: string, tableComponent: EntityTableComponent): void {
    this.modalService.open('slide-in-form', new WebdavFormComponent(this.router, this.ws, this.dialog, this.loader, this.translate));
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      tableComponent.getData();
    });
  }

  doEdit(rowId: string, tableComponent: EntityTableComponent): void {
    this.modalService.open('slide-in-form', new WebdavFormComponent(this.router, this.ws, this.dialog, this.loader, this.translate), rowId);
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      tableComponent.getData();
    });
  }
}

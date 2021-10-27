import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptext_sharing_webdav } from 'app/helptext/sharing';
import { WebDavShare, WebDavShareUpdate } from 'app/interfaces/web-dav-share.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form/webdav-form.component';
import { ModalService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'webdav-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class WebdavListComponent implements EntityTableConfig {
  title = this.translate.instant('WebDAV');
  queryCall = 'sharing.webdav.query' as const;
  updateCall = 'sharing.webdav.update' as const;
  wsDelete = 'sharing.webdav.delete' as const;
  route_delete: string[] = ['sharing', 'webdav', 'delete'];
  rowIdentifier = helptext_sharing_webdav.column_name;

  columns = [
    { prop: 'name', name: helptext_sharing_webdav.column_name, always_display: true },
    { prop: 'comment', name: helptext_sharing_webdav.column_comment },
    { prop: 'path', name: helptext_sharing_webdav.column_path, showLockedStatus: true },
    { prop: 'enabled', name: helptext_sharing_webdav.column_enabled, checkbox: true },
    { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
    { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
  ];

  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Webdav'),
      key_props: ['name'],
    },
  };

  constructor(
    private ws: WebSocketService,
    private modalService: ModalService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  doAdd(id: string, tableComponent: EntityTableComponent): void {
    this.modalService.openInSlideIn(WebdavFormComponent);
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      tableComponent.getData();
    });
  }

  doEdit(rowId: string, tableComponent: EntityTableComponent): void {
    this.modalService.openInSlideIn(WebdavFormComponent, rowId);
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      tableComponent.getData();
    });
  }

  onCheckboxChange(row: WebDavShare): void {
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled } as WebDavShareUpdate])
      .pipe(untilDestroyed(this))
      .subscribe(
        (res) => {
          row.enabled = res.enabled;
        },
        (err) => {
          row.enabled = !row.enabled;
          new EntityUtils().handleWSError(this, err, this.dialog);
        },
      );
  }
}

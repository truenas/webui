import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextSharingWebdav } from 'app/helptext/sharing';
import { WebDavShare, WebDavShareUpdate } from 'app/interfaces/web-dav-share.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form/webdav-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class WebdavListComponent implements EntityTableConfig, OnInit {
  title = this.translate.instant('WebDAV');
  queryCall = 'sharing.webdav.query' as const;
  updateCall = 'sharing.webdav.update' as const;
  wsDelete = 'sharing.webdav.delete' as const;
  routeDelete: string[] = ['sharing', 'webdav', 'delete'];
  rowIdentifier = helptextSharingWebdav.column_name;
  emptyTableConfigMessages = {
    first_use: {
      title: this.translate.instant('No WebDAV Shares have been configured yet'),
      message: this.translate.instant('It seems you haven\'t setup any WebDAV Shares yet. Please click the button below to add an WebDAV Share.'),
    },
    no_page_data: {
      title: this.translate.instant('No WebDAV Shares have been configured yet'),
      message: this.translate.instant('The system could not retrieve any WebDAV Shares from the database. Please click the button below to add an WebDAV Share.'),
    },
    buttonText: this.translate.instant('Add WebDAV Share'),
  };
  columns = [
    { prop: 'name', name: helptextSharingWebdav.column_name, always_display: true },
    { prop: 'comment', name: helptextSharingWebdav.column_comment },
    { prop: 'path', name: helptextSharingWebdav.column_path, showLockedStatus: true },
    { prop: 'enabled', name: helptextSharingWebdav.column_enabled, checkbox: true },
    { prop: 'ro', name: helptextSharingWebdav.column_ro, hidden: true },
    { prop: 'perm', name: helptextSharingWebdav.column_perm, hidden: true },
  ];

  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Webdav'),
      key_props: ['name'],
    },
  };

  private tableComponent: EntityTableComponent;

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.tableComponent.getData();
    });
  }

  doAdd(id: string, tableComponent: EntityTableComponent): void {
    this.tableComponent = tableComponent;
    this.slideInService.open(WebdavFormComponent);
  }

  doEdit(rowId: string, tableComponent: EntityTableComponent): void {
    this.tableComponent = tableComponent;
    const webdavForm = this.slideInService.open(WebdavFormComponent);
    webdavForm.setWebdavForEdit(tableComponent.rows.find((row) => row.id === rowId));
  }

  onCheckboxChange(row: WebDavShare): void {
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled } as WebDavShareUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (share) => {
          row.enabled = share.enabled;
        },
        error: (err) => {
          row.enabled = !row.enabled;
          new EntityUtils().handleWsError(this, err, this.dialog);
        },
      });
  }
}

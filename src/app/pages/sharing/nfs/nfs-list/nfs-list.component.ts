import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { shared, helptextSharingNfs } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class NfsListComponent implements EntityTableConfig<NfsShare> {
  title = this.translate.instant('NFS');
  queryCall = 'sharing.nfs.query' as const;
  updateCall = 'sharing.nfs.update' as const;
  wsDelete = 'sharing.nfs.delete' as const;
  routeAdd: string[] = ['sharing', 'nfs', 'add'];
  routeAddTooltip = this.translate.instant('Add Unix (NFS) Share');
  routeEdit: string[] = ['sharing', 'nfs', 'edit'];
  protected routeDelete: string[] = ['sharing', 'nfs', 'delete'];
  entityList: EntityTableComponent<NfsShare>;
  emptyTableConfigMessages = {
    first_use: {
      title: this.translate.instant('No NFS Shares have been configured yet'),
      message: this.translate.instant('It seems you haven\'t setup any NFS Shares yet. Please click the button below to add an NFS Share.'),
    },
    no_page_data: {
      title: this.translate.instant('No NFS Shares have been configured yet'),
      message: this.translate.instant('The system could not retrieve any NFS Shares from the database. Please click the button below to add an NFS Share.'),
    },
    buttonText: this.translate.instant('Add NFS Share'),
  };

  columns = [
    {
      name: this.translate.instant(helptextSharingNfs.column_path), prop: 'path', showLockedStatus: true, always_display: true,
    },
    { name: this.translate.instant(helptextSharingNfs.column_comment), prop: 'comment' },
    { name: this.translate.instant(helptextSharingNfs.column_enabled), prop: 'enabled', checkbox: true },
  ];
  rowIdentifier = 'nfs_paths';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Unix (NFS) Share'),
      key_props: ['path'],
    },
  };

  constructor(
    private slideInService: IxSlideInService,
    protected ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent<NfsShare>): void {
    this.entityList = entityList;
  }

  confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: this.translate.instant('Unshare'),
    buildTitle: (share: NfsShare) => `${this.translate.instant('Unshare')} ${share.path}`,
  };

  doAdd(): void {
    const slideInRef = this.slideInService.open(NfsFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number): void {
    const nfsShare = this.entityList.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(NfsFormComponent, { data: nfsShare });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  onCheckboxChange(row: NfsShare, loader$: Subject<boolean>): void {
    loader$.next(true);
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (share) => {
          row.enabled = share.enabled;
        },
        error: (error: WebsocketError) => {
          row.enabled = !row.enabled;
          this.dialog.error(this.errorHandler.parseWsError(error));
        },
        complete: () => {
          loader$.next(false);
        },
      });
  }
}

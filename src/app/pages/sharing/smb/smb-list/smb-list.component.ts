import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { take } from 'rxjs/operators';
import { shared, helptextSharingSmb } from 'app/helptext/sharing';
import vol_helptext from 'app/helptext/storage/volumes/volume-list';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class SmbListComponent implements EntityTableConfig<SmbShare> {
  title = 'Samba';
  queryCall = 'sharing.smb.query' as const;
  updateCall = 'sharing.smb.update' as const;
  wsDelete = 'sharing.smb.delete' as const;
  routeAdd: string[] = ['sharing', 'smb', 'add'];
  routeAddTooltip = this.translate.instant('Add Windows (SMB) Share');
  protected routeDelete: string[] = ['sharing', 'smb', 'delete'];
  isClustered = false;
  addBtnDisabled = false;
  noAdd = false;
  private entityList: EntityTableComponent<SmbShare>;
  emptyTableConfigMessages = {
    first_use: {
      title: this.translate.instant('No SMB Shares have been configured yet'),
      message: this.translate.instant('It seems you haven\'t setup any SMB Shares yet. Please click the button below to add an SMB Share.'),
    },
    no_page_data: {
      title: this.translate.instant('No SMB Shares have been configured yet'),
      message: this.translate.instant('The system could not retrieve any SMB Shares from the database. Please click the button below to add an SMB Share.'),
    },
    buttonText: this.translate.instant('Add SMB Share'),
  };

  columns = [
    { name: helptextSharingSmb.column_name, prop: 'name', always_display: true },
    { name: helptextSharingSmb.column_path, prop: 'path_local', showLockedStatus: true },
    { name: helptextSharingSmb.column_comment, prop: 'comment' },
    { name: helptextSharingSmb.column_enabled, prop: 'enabled', checkbox: true },
  ];
  rowIdentifier = 'cifs_name';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Windows (SMB) Share',
      key_props: ['name'],
    },
  };

  confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: this.translate.instant('Unshare'),
    buildTitle: (share: SmbShare) => `${this.translate.instant('Unshare')} ${share.name}`,
  };

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private router: Router,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private appLoader: AppLoaderService,
  ) {}

  preInit(entityList: EntityTableComponent<SmbShare>): void {
    this.entityList = entityList;
    this.ws.call('cluster.utils.is_clustered').pipe(untilDestroyed(this)).subscribe((isClustered) => {
      this.isClustered = isClustered;
      if (this.isClustered) {
        this.addBtnDisabled = true;
        this.noAdd = true;
        _.find(this.entityList.allColumns, { name: helptextSharingSmb.column_enabled }).disabled = true;
      }
    });
  }

  afterInit(entityList: EntityTableComponent<SmbShare>): void {
    this.entityList = entityList;
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(SmbFormComponent);
    slideInRef.slideInClosed$.pipe(take(1), untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: string | number): void {
    const slideInRef = this.slideInService.open(SmbFormComponent, {
      data: this.entityList.rows.find((share) => share.id === id),
    });
    slideInRef.slideInClosed$.pipe(take(1), untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  getActions(smbShare: SmbShare): EntityTableAction[] {
    const rowName = smbShare.path.replace('/mnt/', '');
    const optionDisabled = !rowName.includes('/');
    return [
      {
        id: smbShare.name,
        icon: 'edit',
        name: 'edit',
        disabled: this.isClustered,
        label: this.translate.instant('Edit'),
        onClick: (row: SmbShare) => this.entityList.doEdit(row.id),
      },
      {
        id: smbShare.name,
        icon: 'security',
        name: 'share_acl',
        disabled: this.isClustered,
        label: helptextSharingSmb.action_share_acl,
        onClick: (row: SmbShare) => {
          this.appLoader.open();
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
            (isLocked) => {
              if (isLocked) {
                this.appLoader.close();
                this.lockedPathDialog(row.path);
              } else {
                // A home share has a name (homes) set; row.name works for other shares
                const searchName = row.home ? 'homes' : row.name;
                this.ws.call('sharing.smb.getacl', [{ share_name: searchName }])
                  .pipe(untilDestroyed(this))
                  .subscribe((shareAcl) => {
                    this.appLoader.close();
                    const slideInRef = this.slideInService.open(SmbAclComponent, { data: shareAcl.share_name });
                    slideInRef.slideInClosed$.pipe(take(1), untilDestroyed(this)).subscribe(() => {
                      this.entityList.getData();
                    });
                  });
              }
            },
          );
        },
      },
      {
        id: smbShare.name,
        icon: 'security',
        name: 'edit_acl',
        disabled: optionDisabled,
        matTooltip: vol_helptext.acl_edit_msg,
        label: helptextSharingSmb.action_edit_acl,
        onClick: (row: SmbShare) => {
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe({
            next: (isLocked) => {
              if (isLocked) {
                this.lockedPathDialog(row.path);
              } else {
                this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
                  queryParams: {
                    path: row.path_local,
                  },
                });
              }
            },
            error: (error: WebsocketError) => {
              this.dialogService.error({
                title: helptextSharingSmb.action_edit_acl_dialog.title,
                message: error.reason,
                backtrace: error.trace.formatted,
              });
            },
          });
        },
      },
      {
        id: smbShare.name,
        icon: 'delete',
        name: 'delete',
        disabled: this.isClustered,
        label: this.translate.instant('Delete'),
        onClick: (row: SmbShare) => this.entityList.doDelete(row),
      },
    ] as EntityTableAction[];
  }

  lockedPathDialog(path: string): void {
    this.dialogService.error({
      title: helptextSharingSmb.action_edit_acl_dialog.title,
      message: this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    });
  }

  onCheckboxChange(row: SmbShare): void {
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe({
      next: (share) => {
        row.enabled = share.enabled;
      },
      error: (error: WebsocketError) => {
        row.enabled = !row.enabled;
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { shared, helptextSharingSmb } from 'app/helptext/sharing';
import vol_helptext from 'app/helptext/storage/volumes/volume-list';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class SmbListComponent implements EntityTableConfig {
  title = 'Samba';
  queryCall = 'sharing.smb.query' as const;
  updateCall = 'sharing.smb.update' as const;
  wsDelete = 'sharing.smb.delete' as const;
  routeAdd: string[] = ['sharing', 'smb', 'add'];
  routeAddTooltip = this.translate.instant('Add Windows (SMB) Share');
  protected routeDelete: string[] = ['sharing', 'smb', 'delete'];
  private entityList: EntityTableComponent;
  productType = this.systemGeneralService.getProductType();
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
    { name: helptextSharingSmb.column_path, prop: 'path', showLockedStatus: true },
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
    private ws: WebSocketService,
    private router: Router,
    private slideInService: IxSlideInService,
    private dialog: DialogService,
    private translate: TranslateService,
    private systemGeneralService: SystemGeneralService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  doAdd(): void {
    this.slideInService.open(SmbFormComponent);
    this.slideInService.onClose$.pipe(take(1), untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  doEdit(id: string | number): void {
    const form = this.slideInService.open(SmbFormComponent);
    form.setSmbShareForEdit(this.entityList.rows.find((share) => share.id === id));
    this.slideInService.onClose$.pipe(take(1), untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  getActions(row: SmbShare): EntityTableAction[] {
    const rowName = row.path.replace('/mnt/', '');
    const poolName = rowName.split('/')[0];
    const optionDisabled = !rowName.includes('/');
    return [
      {
        id: row.name,
        icon: 'edit',
        name: 'edit',
        label: this.translate.instant('Edit'),
        onClick: (row: SmbShare) => this.entityList.doEdit(row.id),
      },
      {
        id: row.name,
        icon: 'security',
        name: 'share_acl',
        label: helptextSharingSmb.action_share_acl,
        onClick: (row: SmbShare) => {
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
            (isLocked) => {
              if (isLocked) {
                this.lockedPathDialog(row.path);
              } else {
                // A home share has a name (homes) set; row.name works for other shares
                const searchName = row.home ? 'homes' : row.name;
                this.ws.call('smb.sharesec.query', [[['share_name', '=', searchName]]]).pipe(untilDestroyed(this)).subscribe(
                  (shareSecs) => {
                    const form = this.slideInService.open(SmbAclComponent);
                    form.setSmbShareName(shareSecs[0].share_name);
                  },
                );
              }
            },
          );
        },
      },
      {
        id: row.name,
        icon: 'security',
        name: 'edit_acl',
        disabled: optionDisabled,
        matTooltip: vol_helptext.acl_edit_msg,
        label: helptextSharingSmb.action_edit_acl,
        onClick: (row: SmbShare) => {
          const datasetId = rowName;
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe({
            next: (isLocked) => {
              if (isLocked) {
                this.lockedPathDialog(row.path);
              } else if (this.productType.includes(ProductType.Scale)) {
                this.router.navigate(
                  ['/'].concat(['storage', 'id', poolName, 'dataset', 'posix-acl', datasetId]),
                );
              } else {
                this.router.navigate(
                  ['/'].concat(['storage', 'pools', 'id', poolName, 'dataset', 'acl', datasetId]),
                );
              }
            },
            error: (err) => {
              this.dialog.errorReport(helptextSharingSmb.action_edit_acl_dialog.title,
                err.reason, err.trace.formatted);
            },
          });
        },
      },
      {
        id: row.name,
        icon: 'delete',
        name: 'delete',
        label: this.translate.instant('Delete'),
        onClick: (row: SmbShare) => this.entityList.doDelete(row),
      },
    ] as EntityTableAction[];
  }

  lockedPathDialog(path: string): void {
    this.dialog.errorReport(
      helptextSharingSmb.action_edit_acl_dialog.title,
      this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    );
  }

  onCheckboxChange(row: SmbShare): void {
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe({
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

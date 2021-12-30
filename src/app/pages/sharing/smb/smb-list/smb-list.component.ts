import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import { shared, helptextSharingSmb } from 'app/helptext/sharing';
import vol_helptext from 'app/helptext/storage/volumes/volume-list';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { DialogService, WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-smb-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
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
  productType = window.localStorage.getItem('product_type') as ProductType;
  emptyTableConfigMessages = {
    first_use: {
      title: this.translate.instant('No SMB Shares'),
      message: this.translate.instant('It seems you haven\'t setup any SMB Shares yet. Please click the button below to add an SMB Share.'),
    },
    no_page_data: {
      title: this.translate.instant('No SMB Shares'),
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
    private dialog: DialogService,
    private translate: TranslateService,
    private modalService: ModalService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(SmbFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
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
            (res) => {
              if (res) {
                this.lockedPathDialog(row.path);
              } else {
                // A home share has a name (homes) set; row.name works for other shares
                const searchName = row.home ? 'homes' : row.name;
                this.ws.call('smb.sharesec.query', [[['share_name', '=', searchName]]]).pipe(untilDestroyed(this)).subscribe(
                  (res) => {
                    this.router.navigate(
                      ['/'].concat(['sharing', 'smb', 'acl', String(res[0].id)]),
                    );
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
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              if (res) {
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
            }, (err) => {
              this.dialog.errorReport(helptextSharingSmb.action_edit_acl_dialog.title,
                err.reason, err.trace.formatted);
            },
          );
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
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        row.enabled = res.enabled;
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWsError(this, err, this.dialog);
      },
    );
  }
}

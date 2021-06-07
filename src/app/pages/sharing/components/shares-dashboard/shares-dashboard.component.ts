import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptext_sharing_webdav, helptext_sharing_smb, helptext_sharing_nfs } from 'app/helptext/sharing';
import { ApiDirectory } from 'app/interfaces/api-directory.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { ExpandableTableState, InputExpandableTableConf } from 'app/pages/common/entity/table/expandable-table/expandable-table.component';
import { TableComponent, AppTableHeaderExtraAction } from 'app/pages/common/entity/table/table.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form';
import { NFSFormComponent } from 'app/pages/sharing/nfs/nfs-form';
import { SMBFormComponent } from 'app/pages/sharing/smb/smb-form';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form';
import {
  AppLoaderService, DialogService, IscsiService, ModalService, NetworkService, SystemGeneralService, UserService, WebSocketService,
} from 'app/services';
import { T } from 'app/translate-marker';

enum ShareType {
  SMB = 'smb',
  NFS = 'nfs',
  ISCSI = 'iscsi',
  WebDAV = 'webdav',
}

@UntilDestroy()
@Component({
  selector: 'app-shares-dashboard',
  templateUrl: './shares-dashboard.template.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  providers: [IscsiService],
})
export class SharesDashboardComponent {
  webdavTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.WebDAV);
  nfsTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.NFS);
  smbTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.SMB);
  iscsiTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.ISCSI);

  emptyTableConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    large: true,
    title: 'No Shares Configured',
    message: 'You have not configured any shares yet. Click the \'Add Share\' button to add your first share.',
    button: {
      label: 'Add Share',
      action: this.showAddDialog.bind(this),
    },
  };

  webdavHasItems = 0;
  nfsHasItems = 0;
  smbHasItems = 0;
  iscsiHasItems = 0;
  noOfPopulatedTables = 0;

  webdavExpandableState: ExpandableTableState;
  nfsExpandableState: ExpandableTableState;
  smbExpandableState: ExpandableTableState;
  iscsiExpandableState: ExpandableTableState;
  onDestroy$ = new Subject();
  smbServiceStatus = ServiceStatus.Loading;
  webdavServiceStatus = ServiceStatus.Loading;
  nfsServiceStatus = ServiceStatus.Loading;
  iscsiServiceStatus = ServiceStatus.Loading;
  readonly ServiceStatus = ServiceStatus;

  constructor(private userService: UserService, private modalService: ModalService, private ws: WebSocketService,
    private dialog: DialogService, private networkService: NetworkService, private router: Router,
    private loader: AppLoaderService, private sysGeneralService: SystemGeneralService, private aroute: ActivatedRoute,
    private iscsiService: IscsiService, private translate: TranslateService) {
    this.ws
      .call('service.query', [])
      .pipe(takeUntil(this.onDestroy$))
      .pipe(untilDestroyed(this)).subscribe((services) => {
        [
          _.find(services, { service: ServiceName.Cifs }),
          _.find(services, { service: ServiceName.Iscsi }),
          _.find(services, { service: ServiceName.WebDav }),
          _.find(services, { service: ServiceName.Nfs }),
        ].forEach((service) => {
          this.updateTableServiceStatus(service);
        });
      });
  }

  ngAfterViewInit(): void {
    if (this.webdavHasItems) {
      this.webdavExpandableState = ExpandableTableState.Expanded;
    }
    if (this.nfsHasItems) {
      this.nfsExpandableState = ExpandableTableState.Expanded;
    }
    if (this.smbHasItems) {
      this.smbExpandableState = ExpandableTableState.Expanded;
    }
    if (this.iscsiHasItems) {
      this.iscsiExpandableState = ExpandableTableState.Expanded;
    }
  }

  refreshDashboard(shareType: ShareType = null): void {
    switch (shareType) {
      case ShareType.ISCSI: {
        this.iscsiTableConf = this.getTableConfigForShareType(ShareType.ISCSI);
        break;
      }
      case ShareType.NFS: {
        this.nfsTableConf = this.getTableConfigForShareType(ShareType.NFS);
        break;
      }
      case ShareType.SMB: {
        this.smbTableConf = this.getTableConfigForShareType(ShareType.SMB);
        break;
      }
      case ShareType.WebDAV: {
        this.webdavTableConf = this.getTableConfigForShareType(ShareType.WebDAV);
        break;
      }
      default: {
        this.webdavTableConf = this.getTableConfigForShareType(ShareType.WebDAV);
        this.nfsTableConf = this.getTableConfigForShareType(ShareType.NFS);
        this.smbTableConf = this.getTableConfigForShareType(ShareType.SMB);
        this.iscsiTableConf = this.getTableConfigForShareType(ShareType.ISCSI);
        break;
      }
    }
  }

  getTableConfigForShareType(shareType: ShareType): InputExpandableTableConf {
    switch (shareType) {
      case ShareType.NFS: {
        return {
          title: T('UNIX (NFS) Shares'),
          titleHref: '/sharing/nfs',
          queryCall: 'sharing.nfs.query',
          deleteCall: 'sharing.nfs.delete',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          limitRowsByMaxHeight: true,
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { name: helptext_sharing_nfs.column_path, prop: 'paths', always_display: true },
            { name: helptext_sharing_nfs.column_comment, prop: 'comment' },
            {
              name: helptext_sharing_nfs.column_enabled,
              prop: 'enabled',
              checkbox: true,
              onChange: (row: any) => this.onCheckboxStateToggle(ShareType.NFS, row),
            },
          ],
          detailsHref: '/sharing/nfs',
          add() {
            this.parent.add(this.tableComponent, ShareType.NFS);
          },
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.NFS, row.id);
          },
          afterGetData: (data: any) => {
            this.nfsHasItems = 0;
            this.nfsExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.nfsHasItems = 1;
              this.nfsExpandableState = ExpandableTableState.Expanded;
              this.updateNumberOfTables();
            }
          },
          limitRows: 5,
        };
      }
      case ShareType.ISCSI: {
        return {
          title: T('Block (iSCSI) Shares Targets'),
          titleHref: '/sharing/iscsi/target',
          queryCall: 'iscsi.target.query',
          deleteCall: 'iscsi.target.delete',
          detailsHref: '/sharing/iscsi/target',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          limitRowsByMaxHeight: true,
          emptyEntityLarge: false,
          parent: this,
          columns: [
            {
              name: T('Target Name'),
              prop: 'name',
              always_display: true,
            },
            {
              name: T('Target Alias'),
              prop: 'alias',
            },
          ],
          add() {
            this.parent.add(this.tableComponent, ShareType.ISCSI);
          },
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.ISCSI, row.id);
          },
          afterGetData: (data: any) => {
            this.iscsiHasItems = 0;
            this.iscsiExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.iscsiHasItems = 1;
              this.iscsiExpandableState = ExpandableTableState.Expanded;
              this.updateNumberOfTables();
            }
          },
          limitRows: 5,
          configure: () => {
            this.router.navigate(['/', 'sharing', 'iscsi']);
          },
        };
      }
      case ShareType.WebDAV: {
        return {
          title: T('WebDAV'),
          titleHref: '/sharing/webdav',
          queryCall: 'sharing.webdav.query',
          deleteCall: 'sharing.webdav.delete',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { prop: 'name', name: helptext_sharing_webdav.column_name, always_display: true },
            { prop: 'comment', name: helptext_sharing_webdav.column_comment },
            { prop: 'path', name: helptext_sharing_webdav.column_path },
            { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
            { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
            {
              prop: 'enabled',
              name: helptext_sharing_webdav.column_enabled,
              checkbox: true,
              onChange: (row: any) => this.onCheckboxStateToggle(ShareType.WebDAV, row),
            },
          ],
          add() {
            this.parent.add(this.tableComponent, ShareType.WebDAV);
          },
          limitRowsByMaxHeight: true,
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.WebDAV, row.id);
          },
          afterGetData: (data: any) => {
            this.webdavHasItems = 0;
            this.webdavExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.webdavHasItems = 1;
              this.webdavExpandableState = ExpandableTableState.Expanded;
              this.updateNumberOfTables();
            }
          },
          detailsHref: '/sharing/webdav',
          limitRows: 5,
        };
      }
      case ShareType.SMB: {
        return {
          title: T('Windows (SMB) Shares'),
          titleHref: '/sharing/smb',
          queryCall: 'sharing.smb.query',
          deleteCall: 'sharing.smb.delete',
          deleteMsg: {
            title: T('Delete'),
            key_props: ['name'],
          },
          detailsHref: '/sharing/smb',
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { name: helptext_sharing_smb.column_name, prop: 'name', always_display: true },
            { name: helptext_sharing_smb.column_path, prop: 'path' },
            { name: helptext_sharing_smb.column_comment, prop: 'comment' },
            {
              name: helptext_sharing_smb.column_enabled,
              prop: 'enabled',
              checkbox: true,
              onChange: (row: any) => this.onCheckboxStateToggle(ShareType.SMB, row),
            },
          ],
          limitRowsByMaxHeight: true,
          add() {
            this.parent.add(this.tableComponent, ShareType.SMB);
          },
          edit(row: any) {
            this.parent.edit(this.tableComponent, ShareType.SMB, row.id);
          },
          afterGetData: (data: any) => {
            this.smbHasItems = 0;
            this.smbExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.smbHasItems = 1;
              this.smbExpandableState = ExpandableTableState.Expanded;
              this.updateNumberOfTables();
            }
          },
          limitRows: 5,
        };
      }
    }
  }

  updateNumberOfTables(): void {
    this.noOfPopulatedTables = this.nfsHasItems + this.smbHasItems + this.iscsiHasItems + this.webdavHasItems;
  }

  add(tableComponent: TableComponent, share: ShareType, id?: number): void {
    let formComponent: NFSFormComponent | SMBFormComponent | WebdavFormComponent | TargetFormComponent;
    switch (share) {
      case ShareType.NFS:
        formComponent = new NFSFormComponent(this.userService, this.modalService, this.ws, this.dialog, this.networkService);
        break;
      case ShareType.SMB:
        formComponent = new SMBFormComponent(this.router, this.ws, this.dialog, this.loader, this.sysGeneralService, this.modalService);
        break;
      case ShareType.WebDAV:
        formComponent = new WebdavFormComponent(this.router, this.ws, this.dialog, this.loader);
        break;
      case ShareType.ISCSI:
        formComponent = new TargetFormComponent(this.router, this.aroute, this.iscsiService, this.loader, this.translate, this.ws, this.modalService);
        break;
    }
    this.modalService.open('slide-in-form', formComponent, id);
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      if (!tableComponent) {
        this.refreshDashboard();
      } else {
        tableComponent.getData();
      }
    }, (err) => {
      new EntityUtils().handleWSError(this, err, this.dialog);
    });
  }

  edit(tableComponent: TableComponent, share: ShareType, id: number): void {
    this.add(tableComponent, share, id);
  }

  getTablesOrder(): string[] {
    const order: string[] = [ShareType.SMB, ShareType.NFS, ShareType.ISCSI, ShareType.WebDAV];
    // Note: The order of these IFs is important. One can't come before the other
    if (!this.smbHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.SMB), 1);
      order.push(ShareType.SMB);
    }
    if (!this.nfsHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.NFS), 1);
      order.push(ShareType.NFS);
    }
    if (!this.iscsiHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.ISCSI), 1);
      order.push(ShareType.ISCSI);
    }
    if (!this.webdavHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.WebDAV), 1);
      order.push(ShareType.WebDAV);
    }
    return order;
  }

  getContainerClass(): string {
    this.noOfPopulatedTables = this.webdavHasItems + this.nfsHasItems + this.smbHasItems + this.iscsiHasItems;
    switch (this.noOfPopulatedTables) {
      case 0:
        return 'zero-table-container';
      case 1:
        return 'one-table-container';
      case 2:
        return 'two-table-container';
      case 3:
        return 'three-table-container';
      case 4:
        return 'four-table-container';
      default:
        return 'four-table-container';
    }
  }

  getWebdavOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.WebDAV));
  }

  getNfsOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.NFS));
  }

  getIscsiOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.ISCSI));
  }

  getSmbOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.SMB));
  }

  getOrderFromIndex(index: number): string {
    switch (index) {
      case 0:
        return 'first';
      case 1:
        return 'second';
      case 2:
        return 'third';
      case 3:
        return 'fourth';
    }
  }

  showAddDialog(): void {
    const conf: DialogFormConfiguration = {
      title: 'Add New Share',
      message: 'Select the type of Share you want to add',
      saveButtonText: 'Create',
      fieldConfig: [{
        type: 'radio',
        name: 'share_type',
        options: [
          { label: 'SMB', value: ShareType.SMB },
          { label: 'NFS', value: ShareType.NFS },
          { label: 'iSCSI Target', value: ShareType.ISCSI },
          { label: 'WebDAV', value: ShareType.WebDAV },
        ],
        validation: [Validators.required],
      },
      ],
      customSubmit: (dialog: EntityDialogComponent) => {
        dialog.dialogRef.close();
        dialog.parent.add(null, dialog.formValue.share_type);
      },
      parent: this,
    };
    this.dialog.dialogForm(conf);
  }

  onCheckboxStateToggle(card: ShareType, row: any): void {
    let updateCall: keyof ApiDirectory;
    switch (card) {
      case ShareType.SMB:
        updateCall = 'sharing.smb.update';
        break;
      case ShareType.WebDAV:
        updateCall = 'sharing.webdav.update';
        break;
      case ShareType.NFS:
        updateCall = 'sharing.nfs.update';
        break;
      default:
        return;
    }

    this.ws.call(updateCall, [row.id, { enabled: row.enabled }]).pipe(untilDestroyed(this)).subscribe(
      (updatedEntity) => {
        row.enabled = updatedEntity.enabled;

        if (!updatedEntity) {
          row.enabled = !row.enabled;
        }
      },
      (err) => {
        row.enabled = !row.enabled;
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  updateTableServiceStatus(service: Service): void {
    switch (service.service) {
      case ServiceName.Cifs:
        this.smbServiceStatus = service.state;
        this.smbTableConf.tableExtraActions = this.getTableExtraActions(service);
        break;
      case ServiceName.Nfs:
        this.nfsServiceStatus = service.state;
        this.nfsTableConf.tableExtraActions = this.getTableExtraActions(service);
        break;
      case ServiceName.WebDav:
        this.webdavServiceStatus = service.state;
        this.webdavTableConf.tableExtraActions = this.getTableExtraActions(service);
        break;
      case ServiceName.Iscsi:
        this.iscsiServiceStatus = service.state;
        this.iscsiTableConf.tableExtraActions = this.getTableExtraActions(service);
    }
  }

  getTableExtraActions(service: Service): AppTableHeaderExtraAction[] {
    return [
      {
        label: service.state === ServiceStatus.Running ? T('Turn Off Service') : T('Turn On Service'),
        onClick: () => {
          const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';
          this.updateTableServiceStatus({ ...service, state: ServiceStatus.Loading });
          this.ws.call(rpc, [service.service]).pipe(takeUntil(this.onDestroy$)).pipe(untilDestroyed(this)).subscribe((hasChanged: boolean) => {
            if (hasChanged) {
              if (service.state === ServiceStatus.Running && rpc === 'service.stop') {
                this.dialog.Info(
                  this.translate.instant(T('Service failed to stop')),
                  this.translate.instant('{service} service failed to stop.', { service: serviceNames.get(service.service) || service.service }),
                );
              }
              service.state = ServiceStatus.Running;
            } else {
              if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
                this.dialog.Info(
                  this.translate.instant(T('Service failed to start')),
                  this.translate.instant('{service} service failed to start.', { service: serviceNames.get(service.service) || service.service }),
                );
              }
              service.state = ServiceStatus.Stopped;
            }
            this.updateTableServiceStatus(service);
          });
        },
      },
      {
        label: T('Config Service'),
        onClick: () => {
          if (service.service === ServiceName.Iscsi) {
            this.router.navigate(['/', 'sharing', 'iscsi']);
          } else if (service.service === ServiceName.Cifs) {
            this.router.navigate(['/', 'services', 'smb']);
          } else {
            this.router.navigate(['/', 'services', service.service]);
          }
        },
      },
    ];
  }

  getStatusClass(status: ServiceStatus): string {
    switch (status) {
      case ServiceStatus.Running:
        return 'fn-theme-primary';
      case ServiceStatus.Stopped:
        return 'fn-theme-red';
      default:
        return 'fn-theme-orange';
    }
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}

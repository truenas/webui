import {
  AfterViewInit, Component, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { filter, map } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextSharingWebdav, helptextSharingSmb, helptextSharingNfs } from 'app/helptext/sharing';
import { ApiDirectory } from 'app/interfaces/api-directory.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { WebDavShare } from 'app/interfaces/web-dav-share.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  ExpandableTableComponent,
  ExpandableTableState,
  InputExpandableTableConf,
} from 'app/modules/entity/table/expandable-table/expandable-table.component';
import {
  AppTableHeaderAction,
} from 'app/modules/entity/table/table.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form/webdav-form.component';
import {
  DialogService,
  IscsiService, SystemGeneralService,
  WebSocketService,
} from 'app/services';
import { IxSlideInService, ResponseOnClose } from 'app/services/ix-slide-in.service';

enum ShareType {
  Smb = 'smb',
  Nfs = 'nfs',
  Iscsi = 'iscsi',
  WebDav = 'webdav',
}

type ShareTableRow = Partial<SmbShare> | Partial<WebDavShare> | Partial<NfsShare>;

@UntilDestroy()
@Component({
  templateUrl: './shares-dashboard.component.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  providers: [IscsiService],
})
export class SharesDashboardComponent implements AfterViewInit {
  webdavTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.WebDav);
  nfsTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.Nfs);
  smbTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.Smb);
  iscsiTableConf: InputExpandableTableConf = this.getTableConfigForShareType(ShareType.Iscsi);

  @ViewChild('webdavTable', { static: false }) webdavTable: ExpandableTableComponent;
  @ViewChild('nfsTable', { static: false }) nfsTable: ExpandableTableComponent;
  @ViewChild('smbTable', { static: false }) smbTable: ExpandableTableComponent;
  @ViewChild('iscsiTable', { static: false }) iscsiTable: ExpandableTableComponent;

  webdavHasItems = 0;
  nfsHasItems = 0;
  smbHasItems = 0;
  iscsiHasItems = 0;

  get noOfPopulatedTables(): number {
    return this.nfsHasItems + this.smbHasItems + this.iscsiHasItems + this.webdavHasItems;
  }

  webdavExpandableState: ExpandableTableState;
  nfsExpandableState: ExpandableTableState;
  smbExpandableState: ExpandableTableState;
  iscsiExpandableState: ExpandableTableState;
  smbServiceStatus = ServiceStatus.Loading;
  webdavServiceStatus = ServiceStatus.Loading;
  nfsServiceStatus = ServiceStatus.Loading;
  iscsiServiceStatus = ServiceStatus.Loading;
  readonly servicesToCheck = [ServiceName.Cifs, ServiceName.Iscsi, ServiceName.WebDav, ServiceName.Nfs];
  readonly ServiceStatus = ServiceStatus;

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private router: Router,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private systemGeneralService: SystemGeneralService,
  ) {
    this.getInitialServiceStatus();
  }

  getInitialServiceStatus(): void {
    this.ws
      .call('service.query', [])
      .pipe(untilDestroyed(this))
      .subscribe((services) => {
        this.servicesToCheck.forEach((service) => {
          this.updateTableServiceStatus(_.find(services, { service }));
        });
        this.subscribeToServiceUpdates();
      });
  }

  subscribeToServiceUpdates(): void {
    this.ws
      .subscribe('service.query')
      .pipe(
        map((event) => event.fields),
        filter((service) => this.servicesToCheck.includes(service.service)),
        untilDestroyed(this),
      )
      .subscribe((service: Service) => {
        this.updateTableServiceStatus(service);
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
    this.setupTableRefreshOnPanelClose();
  }

  setupTableRefreshOnPanelClose(): void {
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(({ modalType }: ResponseOnClose) => {
      switch (modalType) {
        case WebdavFormComponent:
          if (!this.webdavTable.tableComponent) {
            this.refreshDashboard();
          }
          this.webdavTable.tableComponent.getData();
          break;
        case SmbFormComponent:
        case SmbAclComponent:
          if (!this.smbTable.tableComponent) {
            this.refreshDashboard();
          }
          this.smbTable.tableComponent.getData();
          break;
        case NfsFormComponent:
          if (!this.nfsTable.tableComponent) {
            this.refreshDashboard();
          }
          this.nfsTable.tableComponent.getData();
          break;
        case TargetFormComponent:
          if (!this.iscsiTable.tableComponent) {
            this.refreshDashboard();
          }
          this.iscsiTable.tableComponent.getData();
          break;
        default:
          this.refreshDashboard();
          break;
      }
    });
  }

  refreshDashboard(): void {
    this.webdavTableConf = this.getTableConfigForShareType(ShareType.WebDav);
    this.nfsTableConf = this.getTableConfigForShareType(ShareType.Nfs);
    this.smbTableConf = this.getTableConfigForShareType(ShareType.Smb);
    this.iscsiTableConf = this.getTableConfigForShareType(ShareType.Iscsi);
  }

  getTableConfigForShareType(shareType: ShareType): InputExpandableTableConf {
    switch (shareType) {
      case ShareType.Nfs: {
        return {
          title: this.translate.instant('UNIX (NFS) Shares'),
          titleHref: '/sharing/nfs',
          queryCall: 'sharing.nfs.query',
          deleteCall: 'sharing.nfs.delete',
          deleteMsg: {
            title: this.translate.instant('NFS Share'),
            key_props: ['path'],
          },
          limitRowsByMaxHeight: true,
          hideEntityEmpty: true,
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { name: helptextSharingNfs.column_path, prop: 'path', showLockedStatus: true },
            { name: helptextSharingNfs.column_comment, prop: 'comment', hiddenIfEmpty: true },
            {
              name: helptextSharingNfs.column_enabled,
              prop: 'enabled',
              width: '60px',
              slideToggle: true,
              onChange: (row: NfsShare) => this.onSlideToggle(ShareType.Nfs, row, 'enabled'),
            },
          ],
          detailsHref: '/sharing/nfs',
          add: () => {
            this.slideInService.open(NfsFormComponent);
          },
          edit: (row: NfsShare): void => {
            const form = this.slideInService.open(NfsFormComponent);
            form.setNfsShareForEdit(row);
          },
          afterGetData: (data: NfsShare[]) => {
            this.nfsHasItems = 0;
            this.nfsExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.nfsHasItems = 1;
              this.nfsExpandableState = ExpandableTableState.Expanded;
            }
          },
          limitRows: 5,
        };
      }
      case ShareType.Iscsi: {
        return {
          title: this.translate.instant('Block (iSCSI) Shares Targets'),
          titleHref: '/sharing/iscsi/target',
          queryCall: 'iscsi.target.query',
          deleteCall: 'iscsi.target.delete',
          detailsHref: '/sharing/iscsi/target',
          deleteMsg: {
            title: this.translate.instant('iSCSI'),
            key_props: ['name'],
          },
          limitRowsByMaxHeight: true,
          hideEntityEmpty: true,
          emptyEntityLarge: false,
          parent: this,
          columns: [
            {
              name: this.translate.instant('Target Name'),
              prop: 'name',
            },
            {
              name: this.translate.instant('Target Alias'),
              prop: 'alias',
            },
          ],
          add: () => {
            this.router.navigate(['/', 'sharing', 'iscsi', 'wizard']);
          },
          addButtonLabel: this.translate.instant('Wizard'),
          edit: (row: IscsiTarget) => {
            const targetForm = this.slideInService.open(TargetFormComponent, { wide: true });
            targetForm.setTargetForEdit(row);
          },
          afterGetData: (data: IscsiTarget[]) => {
            this.iscsiHasItems = 0;
            this.iscsiExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.iscsiHasItems = 1;
              this.iscsiExpandableState = ExpandableTableState.Expanded;
            }
          },
          limitRows: 5,
          configure: () => {
            this.router.navigate(['/', 'sharing', 'iscsi']);
          },
        };
      }
      case ShareType.WebDav: {
        return {
          title: this.translate.instant('WebDAV'),
          titleHref: '/sharing/webdav',
          queryCall: 'sharing.webdav.query',
          deleteCall: 'sharing.webdav.delete',
          deleteMsg: {
            title: this.translate.instant('WebDAV Share'),
            key_props: ['name'],
          },
          emptyEntityLarge: false,
          hideEntityEmpty: true,
          parent: this,
          columns: [
            { prop: 'name', name: helptextSharingWebdav.column_name },
            { prop: 'comment', name: helptextSharingWebdav.column_comment, hiddenIfEmpty: true },
            { prop: 'path', name: helptextSharingWebdav.column_path, showLockedStatus: true },
            {
              prop: 'perm',
              name: helptextSharingWebdav.column_perm,
              slideToggle: true,
              width: '70px',
              tooltip: helptextSharingWebdav.column_perm_tooltip,
            },
            {
              prop: 'ro',
              name: helptextSharingWebdav.column_ro,
              width: '60px',
              slideToggle: true,
              onChange: (row: WebDavShare) => this.onSlideToggle(ShareType.WebDav, row, 'ro'),
            },
            {
              prop: 'enabled',
              name: helptextSharingWebdav.column_enabled,
              width: '60px',
              slideToggle: true,
              onChange: (row: WebDavShare) => this.onSlideToggle(ShareType.WebDav, row, 'enabled'),
            },
          ],
          add: () => {
            this.slideInService.open(WebdavFormComponent);
          },
          limitRowsByMaxHeight: true,
          edit: (row: WebDavShare) => {
            const form = this.slideInService.open(WebdavFormComponent);
            form.setWebdavForEdit(row);
          },
          afterGetData: (data: WebDavShare[]) => {
            this.webdavHasItems = 0;
            this.webdavExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.webdavHasItems = 1;
              this.webdavExpandableState = ExpandableTableState.Expanded;
            }
          },
          detailsHref: '/sharing/webdav',
          limitRows: 5,
        };
      }
      case ShareType.Smb: {
        return {
          title: this.translate.instant('Windows (SMB) Shares'),
          titleHref: '/sharing/smb',
          queryCall: 'sharing.smb.query',
          deleteCall: 'sharing.smb.delete',
          deleteMsg: {
            title: this.translate.instant('SMB Share'),
            key_props: ['name'],
          },
          hideEntityEmpty: true,
          detailsHref: '/sharing/smb',
          emptyEntityLarge: false,
          parent: this,
          columns: [
            { name: helptextSharingSmb.column_name, prop: 'name' },
            { name: helptextSharingSmb.column_path, prop: 'path', showLockedStatus: true },
            { name: helptextSharingSmb.column_comment, prop: 'comment', hiddenIfEmpty: true },
            {
              name: helptextSharingSmb.column_enabled,
              prop: 'enabled',
              width: '60px',
              slideToggle: true,
              onChange: (row: SmbShare) => this.onSlideToggle(ShareType.Smb, row, 'enabled'),
            },
          ],
          limitRowsByMaxHeight: true,
          add: () => {
            this.slideInService.open(SmbFormComponent);
          },
          edit: (row: SmbShare) => {
            const form = this.slideInService.open(SmbFormComponent);
            form.setSmbShareForEdit(row);
          },
          afterGetData: (data: SmbShare[]) => {
            this.smbHasItems = 0;
            this.smbExpandableState = ExpandableTableState.Collapsed;
            if (data.length > 0) {
              this.smbHasItems = 1;
              this.smbExpandableState = ExpandableTableState.Expanded;
            }
          },
          limitRows: 5,
          isActionVisible: (actionId: string, row: SmbShare) => {
            switch (actionId) {
              case 'edit_acl':
                const rowName = row.path.replace('/mnt/', '');
                return rowName.includes('/');
              default:
                return true;
            }
          },
          getActions: () => {
            return [
              {
                icon: 'share',
                name: 'share_acl',
                matTooltip: helptextSharingSmb.action_share_acl,
                onClick: (row: SmbShare) => {
                  this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
                    (isLocked) => {
                      if (isLocked) {
                        this.lockedPathDialog(row.path);
                      } else {
                        // A home share has a name (homes) set; row.name works for other shares
                        const searchName = row.home ? 'homes' : row.name;
                        this.ws.call('smb.sharesec.query', [[['share_name', '=', searchName]]]).pipe(untilDestroyed(this)).subscribe(
                          (sharesecs) => {
                            const form = this.slideInService.open(SmbAclComponent);
                            form.setSmbShareName(sharesecs[0].share_name);
                          },
                        );
                      }
                    },
                  );
                },
              },
              {
                icon: 'security',
                name: 'edit_acl',
                matTooltip: helptextSharingSmb.action_edit_acl,
                onClick: (row: SmbShare) => {
                  const rowName = row.path.replace('/mnt/', '');
                  const poolName = rowName.split('/')[0];
                  const datasetId = rowName;
                  const productType = this.systemGeneralService.getProductType();
                  this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
                    (isLocked) => {
                      if (isLocked) {
                        this.lockedPathDialog(row.path);
                      } else if (productType.includes(ProductType.Scale)) {
                        this.router.navigate(['/', 'storage', 'id', poolName, 'dataset', 'posix-acl', datasetId]);
                      } else {
                        this.router.navigate(['/', 'storage', 'pools', 'id', poolName, 'dataset', 'acl', datasetId]);
                      }
                    },
                  );
                },
              },
            ];
          },
        };
      }
    }
  }

  getTablesOrder(): string[] {
    const order: string[] = [ShareType.Smb, ShareType.Nfs, ShareType.Iscsi, ShareType.WebDav];
    // Note: The order of these IFs is important. One can't come before the other
    if (!this.smbHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.Smb), 1);
      order.push(ShareType.Smb);
    }
    if (!this.nfsHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.Nfs), 1);
      order.push(ShareType.Nfs);
    }
    if (!this.iscsiHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.Iscsi), 1);
      order.push(ShareType.Iscsi);
    }
    if (!this.webdavHasItems) {
      order.splice(order.findIndex((share) => share === ShareType.WebDav), 1);
      order.push(ShareType.WebDav);
    }
    return order;
  }

  getContainerClass(): string {
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
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.WebDav));
  }

  getNfsOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.Nfs));
  }

  getIscsiOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.Iscsi));
  }

  getSmbOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === ShareType.Smb));
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

  onSlideToggle(card: ShareType, row: ShareTableRow, param: 'enabled' | 'ro'): void {
    let updateCall: keyof ApiDirectory;
    switch (card) {
      case ShareType.Smb:
        updateCall = 'sharing.smb.update';
        break;
      case ShareType.WebDav:
        updateCall = 'sharing.webdav.update';
        break;
      case ShareType.Nfs:
        updateCall = 'sharing.nfs.update';
        break;
      default:
        return;
    }

    this.ws.call(updateCall, [row.id, { [param]: row[param] }]).pipe(untilDestroyed(this)).subscribe({
      next: (updatedEntity) => {
        row[param] = updatedEntity[param];
      },
      error: (err: WebsocketError) => {
        row[param] = !row[param];
        new EntityUtils().handleWsError(this, err, this.dialog);
      },
    });
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

  getTableExtraActions(service: Service): AppTableHeaderAction[] {
    return [
      {
        label: service.state === ServiceStatus.Running
          ? this.translate.instant('Turn Off Service')
          : this.translate.instant('Turn On Service'),
        onClick: () => {
          const rpc = service.state === ServiceStatus.Running ? 'service.stop' : 'service.start';
          this.updateTableServiceStatus({ ...service, state: ServiceStatus.Loading });
          this.ws.call(rpc, [service.service, { silent: false }])
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (hasChanged: boolean) => {
                if (hasChanged) {
                  if (service.state === ServiceStatus.Running && rpc === 'service.stop') {
                    this.dialog.warn(
                      this.translate.instant('Service failed to stop'),
                      this.translate.instant(
                        'The {service} service failed to stop.',
                        { service: serviceNames.get(service.service) || service.service },
                      ),
                    );
                  }
                  service.state = ServiceStatus.Running;
                } else {
                  if (service.state === ServiceStatus.Stopped && rpc === 'service.start') {
                    this.dialog.warn(
                      this.translate.instant('Service failed to start'),
                      this.translate.instant(
                        'The {service} service failed to start.',
                        { service: serviceNames.get(service.service) || service.service },
                      ),
                    );
                  }
                  service.state = ServiceStatus.Stopped;
                }
                this.updateTableServiceStatus(service);
              },
              error: (error) => {
                let message = this.translate.instant(
                  'Error starting service {serviceName}.',
                  { serviceName: serviceNames.get(service.service) || service.service },
                );
                if (rpc === 'service.stop') {
                  message = this.translate.instant(
                    'Error stopping service {serviceName}.',
                    { serviceName: serviceNames.get(service.service) || service.service },
                  );
                }
                this.dialog.errorReport(message, error.reason, error.trace.formatted);
              },
            });
        },
      },
      {
        label: this.translate.instant('Config Service'),
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

  getStatusClass(status: ServiceStatus, count: number): string {
    switch (status) {
      case ServiceStatus.Running:
        return 'fn-theme-primary';
      case ServiceStatus.Stopped:
        return count > 0 ? 'fn-theme-red' : 'fn-theme-grey';
      default:
        return 'fn-theme-orange';
    }
  }

  lockedPathDialog(path: string): void {
    this.dialog.errorReport(
      helptextSharingSmb.action_edit_acl_dialog.title,
      this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    );
  }
}

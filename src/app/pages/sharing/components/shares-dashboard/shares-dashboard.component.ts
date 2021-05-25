import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import _ from 'lodash';

import { T } from 'app/translate-marker';
import { helptext_sharing_webdav } from 'app/helptext/sharing';
import { helptext_sharing_afp } from 'app/helptext/sharing';
import { InputExpandableTableConf } from 'app/pages/common/entity/table/expandable-table/expandable-table.component';
import { helptext_sharing_smb } from 'app/helptext/sharing';
import { NFSFormComponent } from 'app/pages/sharing/nfs/nfs-form';
import {
  AppLoaderService, DialogService, IscsiService, ModalService, NetworkService, SystemGeneralService, UserService, WebSocketService,
} from 'app/services';
import { SMBFormComponent } from 'app/pages/sharing/smb/smb-form';
import { WebdavFormComponent } from 'app/pages/sharing/webdav/webdav-form';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form';
import { Service } from 'app/interfaces/service.interface';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { AppTableHeaderExtraAction } from 'app/pages/common/entity/table/table.component';

enum ShareType {
  SMB = 'smb',
  NFS = 'nfs',
  ISCSI = 'iscsi',
  WebDAV = 'webdav',
}

@Component({
  selector: 'app-shares-dashboard',
  templateUrl: './shares-dashboard.template.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  providers: [IscsiService],
})
export class SharesDashboardComponent implements OnInit, OnDestroy {
  webdavTableConf: InputExpandableTableConf = {
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
      { prop: 'enabled', name: helptext_sharing_webdav.column_enabled },
      { prop: 'ro', name: helptext_sharing_webdav.column_ro, hidden: true },
      { prop: 'perm', name: helptext_sharing_webdav.column_perm, hidden: true },
    ],
    add() {
      this.parent.add(ShareType.WebDAV);
    },
    edit(row) {
      this.parent.edit(ShareType.WebDAV, row.id);
    },
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.webdavHasItems = 1;
        this.webdavTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    collapsedIfEmpty: true,
    detailsHref: '/sharing/webdav',
    limitRows: 5,
  };

  nfsTableConf: InputExpandableTableConf = {
    title: T('UNIX (NFS) Shares'),
    titleHref: '/sharing/nfs',
    queryCall: 'sharing.nfs.query',
    deleteCall: 'sharing.nfs.delete',
    deleteMsg: {
      title: T('Delete'),
      key_props: ['name'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: helptext_sharing_afp.column_name, prop: 'name', always_display: true },
      { name: helptext_sharing_afp.column_path, prop: 'path' },
      { name: helptext_sharing_afp.column_comment, prop: 'comment' },
      { name: helptext_sharing_afp.column_enabled, prop: 'enabled' },
    ],
    detailsHref: '/sharing/nfs',
    add() {
      this.parent.add(ShareType.NFS);
    },
    edit(row) {
      this.parent.edit(ShareType.NFS, row.id);
    },
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.nfsHasItems = 1;
        this.nfsTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    collapsedIfEmpty: true,
    limitRows: 5,
  };

  smbTableConf: InputExpandableTableConf = {
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
      { name: helptext_sharing_smb.column_enabled, prop: 'enabled', checkbox: true },
    ],
    add() {
      this.parent.add(ShareType.SMB);
    },
    edit(row) {
      this.parent.edit(ShareType.SMB, row.id);
    },
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.smbHasItems = 1;
        this.smbTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    collapsedIfEmpty: true,
    limitRows: 5,
  };

  iscsiTableConf: InputExpandableTableConf = {
    title: T('Block (ISCSI) Shares Targets'),
    titleHref: '/sharing/iscsi/target',
    queryCall: 'iscsi.target.query',
    deleteCall: 'iscsi.target.delete',
    detailsHref: '/sharing/iscsi/target',
    deleteMsg: {
      title: T('Delete'),
      key_props: ['name'],
    },
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
      this.parent.add(ShareType.ISCSI);
    },
    edit(row) {
      this.parent.edit(ShareType.ISCSI, row.id);
    },
    collapsedIfEmpty: true,
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.iscsiHasItems = 1;
        this.iscsiTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    limitRows: 5,
  };

  webdavHasItems = 0;
  nfsHasItems = 0;
  smbHasItems = 0;
  iscsiHasItems = 0;
  onDestroy$ = new Subject();

  constructor(private userService: UserService, private modalService: ModalService, private ws: WebSocketService,
    private dialog: DialogService, private networkService: NetworkService, private router: Router,
    private loader: AppLoaderService, private sysGeneralService: SystemGeneralService, private aroute: ActivatedRoute,
    private iscsiService: IscsiService, private translate: TranslateService) {
    this.ws
      .call('service.query', [])
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((services) => {
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

  ngOnInit(): void {
    if (this.webdavHasItems) {
      this.webdavTableConf.alwaysExpanded = true;
    }
    if (this.nfsHasItems) {
      this.nfsTableConf.alwaysExpanded = true;
    }
    if (this.smbHasItems) {
      this.smbTableConf.alwaysExpanded = true;
    }
    if (this.iscsiHasItems) {
      this.iscsiTableConf.alwaysExpanded = true;
    }
  }

  add(share: ShareType, id?: number): void {
    let formComponent: NFSFormComponent | SMBFormComponent | WebdavFormComponent | TargetFormComponent;
    switch (share) {
      case ShareType.NFS:
        formComponent = new NFSFormComponent(this.userService, this.modalService, this.ws, this.dialog, this.networkService);
        break;
      case ShareType.SMB:
        formComponent = new SMBFormComponent(this.router, this.ws, this.dialog, this.loader, this.sysGeneralService, this.modalService);
        break;
      case ShareType.WebDAV:
        formComponent = new WebdavFormComponent(this.router, this.ws, this.dialog);
        break;
      case ShareType.ISCSI:
        formComponent = new TargetFormComponent(this.router, this.aroute, this.iscsiService, this.loader, this.translate, this.ws);
        break;
    }
    this.modalService.open('slide-in-form', formComponent, id);
  }

  edit(share: ShareType, id: number): void {
    this.add(share, id);
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
    const noOfPopulatedTables = this.webdavHasItems + this.nfsHasItems + this.smbHasItems + this.iscsiHasItems;
    switch (noOfPopulatedTables) {
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

  updateTableServiceStatus(service: Service): void {
    switch (service.service) {
      case ServiceName.Cifs:
        this.smbTableConf.serviceStatus = service.state;
        this.smbTableConf.tableExtraActions = this.getTableExtraActions(service);
        break;
      case ServiceName.Nfs:
        this.nfsTableConf.serviceStatus = service.state;
        this.nfsTableConf.tableExtraActions = this.getTableExtraActions(service);
        break;
      case ServiceName.WebDav:
        this.webdavTableConf.serviceStatus = service.state;
        this.webdavTableConf.tableExtraActions = this.getTableExtraActions(service);
        break;
      case ServiceName.Iscsi:
        this.iscsiTableConf.serviceStatus = service.state;
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
          this.ws.call(rpc, [service.service]).pipe(takeUntil(this.onDestroy$)).subscribe((hasChanged: boolean) => {
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

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}

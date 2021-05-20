import { Component, ViewEncapsulation } from '@angular/core';
import { T } from 'app/translate-marker';
import { helptext_sharing_webdav } from 'app/helptext/sharing';
import { helptext_sharing_afp } from 'app/helptext/sharing';
import { InputExpandableTableConf } from 'app/pages/common/entity/table/expandable-table/expandable-table.component';
import { helptext_sharing_smb } from 'app/helptext/sharing';

@Component({
  selector: 'app-shares-dashboard-1',
  templateUrl: './shares-dashboard.template.html',
  styleUrls: ['./shares-dashboard.component.css'],
})
export class SharesDashboardComponent {
  webdavTableConf: InputExpandableTableConf = {
    title: 'WebDAV',
    titleHref: '/sharing/webdav',
    queryCall: 'sharing.webdav.query',
    deleteCall: 'sharing.webdav.delete',
    deleteMsg: {
      title: 'Delete',
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
      this.parent.add('webdav');
    },
    edit(row) {
      this.parent.edit('webdav', row.id);
    },
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.webdavHasItems = 1;
        this.webdavTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    collapsedIfEmpty: true,
  };

  nfsTableConf: InputExpandableTableConf = {
    title: 'UNIX (NFS) Shares',
    titleHref: '/sharing/nfs',
    queryCall: 'sharing.nfs.query',
    deleteCall: 'sharing.nfs.delete',
    deleteMsg: {
      title: 'Delete',
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
    add() {
      this.parent.add('afp');
    },
    edit(row) {
      this.parent.edit('afp', row.id);
    },
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.nfsHasItems = 1;
        this.nfsTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    collapsedIfEmpty: true,
  };

  smbTableConf: InputExpandableTableConf = {
    title: 'Windows (SMB) Shares',
    titleHref: '/sharing/smb',
    queryCall: 'sharing.smb.query',
    deleteCall: 'sharing.smb.delete',
    deleteMsg: {
      title: 'Delete',
      key_props: ['name'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: helptext_sharing_smb.column_name, prop: 'name', always_display: true },
      { name: helptext_sharing_smb.column_path, prop: 'path' },
      { name: helptext_sharing_smb.column_comment, prop: 'comment' },
      { name: helptext_sharing_smb.column_enabled, prop: 'enabled', checkbox: true },
    ],
    add() {
      this.parent.add('smb');
    },
    edit(row) {
      this.parent.edit('smb', row.id);
    },
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.smbHasItems = 1;
        this.smbTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
    collapsedIfEmpty: true,
  };

  iscsiTableConf: InputExpandableTableConf = {
    title: 'Block (ISCSI) Shares Targets',
    titleHref: '/sharing/smb',
    queryCall: 'iscsi.target.query',
    deleteCall: 'iscsi.target.delete',
    deleteMsg: {
      title: 'Delete',
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
      this.parent.add('smb');
    },
    edit(row) {
      this.parent.edit('smb', row.id);
    },
    collapsedIfEmpty: true,
    afterGetData: (data: any) => {
      if (data.length > 0) {
        this.iscsiHasItems = 1;
        this.iscsiTableConf.alwaysExpanded = true;
      }
    },
    expandedIfNotEmpty: true,
  };

  webdavHasItems = 0;
  nfsHasItems = 0;
  smbHasItems = 0;
  iscsiHasItems = 0;

  ngOnInit() {
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

  getTablesOrder(): string[] {
    const order: string[] = ['smb', 'nfs', 'iscsi', 'webdav'];
    // Note: The order of these IFs is important. One can't come before the other
    if (!this.smbHasItems) {
      order.splice(order.findIndex((share) => share === 'smb'), 1);
      order.push('smb');
    }
    if (!this.nfsHasItems) {
      order.splice(order.findIndex((share) => share === 'nfs'), 1);
      order.push('nfs');
    }
    if (!this.iscsiHasItems) {
      order.splice(order.findIndex((share) => share === 'iscsi'), 1);
      order.push('iscsi');
    }
    if (!this.webdavHasItems) {
      order.splice(order.findIndex((share) => share === 'webdav'), 1);
      order.push('webdav');
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
    return this.getOrderFromIndex(order.findIndex((share) => share === 'webdav'));
  }

  getNfsOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === 'nfs'));
  }

  getIscsiOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === 'iscsi'));
  }

  getSmbOrder(): string {
    const order = this.getTablesOrder();
    return this.getOrderFromIndex(order.findIndex((share) => share === 'smb'));
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
}

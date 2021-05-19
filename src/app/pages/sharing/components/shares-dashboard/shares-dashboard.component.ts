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
      console.log('Editing Row', row.id);
      this.parent.edit('webdav', row.id);
    },
  };

  afpTableConf: InputExpandableTableConf = {
    title: 'AFP (Apple File Protocol)',
    titleHref: '/sharing/afp',
    queryCall: 'sharing.afp.query',
    deleteCall: 'sharing.afp.delete',
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
      console.log('Editing Row', row.id);
      this.parent.edit('afp', row.id);
    },
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
      console.log('Editing Row', row.id);
      this.parent.edit('smb', row.id);
    },
  };

  iscsiTableConf: InputExpandableTableConf = {
    title: 'Block (ISCSI) Shares',
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
      console.log('Editing Row', row.id);
      this.parent.edit('smb', row.id);
    },
    collapsedIfEmpty: true,
  };

  webdavHasItems = true;
  afpHasItems = false;
  third = false;
  fourth = false;

  ngOnInit() {
    if (this.webdavHasItems) {
      this.webdavTableConf.alwaysExpanded = true;
    }
    if (this.afpHasItems) {
      this.afpTableConf.alwaysExpanded = true;
    }
  }
}

import { Component } from '@angular/core';
import { shared, helptext_sharing_nfs } from 'app/helptext/sharing';
import { InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { T } from 'app/translate-marker';

@Component({
  selector: 'app-nfs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class NFSListComponent implements InputTableConf {
  title = 'NFS';
  queryCall: 'sharing.nfs.query' = 'sharing.nfs.query';
  wsDelete: 'sharing.nfs.delete' = 'sharing.nfs.delete';
  route_add: string[] = ['sharing', 'nfs', 'add'];
  protected route_add_tooltip = 'Add Unix (NFS) Share';
  route_edit: string[] = ['sharing', 'nfs', 'edit'];
  protected route_delete: string[] = ['sharing', 'nfs', 'delete'];

  columns: any[] = [
    { name: helptext_sharing_nfs.column_path, prop: 'paths', always_display: true },
    { name: helptext_sharing_nfs.column_comment, prop: 'comment' },
    { name: helptext_sharing_nfs.column_enabled, prop: 'enabled' },
  ];
  rowIdentifier = 'nfs_paths';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Unix (NFS) Share',
      key_props: ['paths'],
    },
  };

  confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: T('Unshare'),
    buildTitle: (share: any) => `${T('Unshare')} ${share.paths.join(', ')}`,
  };
}

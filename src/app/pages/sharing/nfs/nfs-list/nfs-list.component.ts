import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { shared, helptext_sharing_nfs } from 'app/helptext/sharing';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import {
  DialogService, NetworkService, WebSocketService, UserService, ModalService,
} from 'app/services';
import { T } from 'app/translate-marker';
import { NFSFormComponent } from '../nfs-form';

@UntilDestroy()
@Component({
  selector: 'app-nfs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class NFSListComponent implements EntityTableConfig {
  title = 'NFS';
  queryCall: 'sharing.nfs.query' = 'sharing.nfs.query';
  wsDelete: 'sharing.nfs.delete' = 'sharing.nfs.delete';
  route_add: string[] = ['sharing', 'nfs', 'add'];
  protected route_add_tooltip = 'Add Unix (NFS) Share';
  route_edit: string[] = ['sharing', 'nfs', 'edit'];
  protected route_delete: string[] = ['sharing', 'nfs', 'delete'];
  entityList: EntityTableComponent;

  columns = [
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

  constructor(
    protected userService: UserService,
    private modalService: ModalService,
    protected ws: WebSocketService,
    private dialog: DialogService,
    public networkService: NetworkService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: T('Unshare'),
    buildTitle: (share: any) => `${T('Unshare')} ${share.paths.join(', ')}`,
  };

  doAdd(id?: number): void {
    const formComponent = new NFSFormComponent(this.userService, this.modalService, this.ws, this.dialog, this.networkService);
    this.modalService.open('slide-in-form', formComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}

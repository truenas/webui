import { Component } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { shared, helptext_sharing_nfs } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, ModalService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { NFSFormComponent } from '../nfs-form/nfs-form.component';

@UntilDestroy()
@Component({
  selector: 'app-nfs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class NFSListComponent implements EntityTableConfig<NfsShare> {
  title = T('NFS');
  queryCall = 'sharing.nfs.query' as const;
  updateCall = 'sharing.nfs.update' as const;
  wsDelete = 'sharing.nfs.delete' as const;
  route_add: string[] = ['sharing', 'nfs', 'add'];
  route_add_tooltip = 'Add Unix (NFS) Share';
  route_edit: string[] = ['sharing', 'nfs', 'edit'];
  protected route_delete: string[] = ['sharing', 'nfs', 'delete'];
  entityList: EntityTableComponent;

  columns = [
    {
      name: helptext_sharing_nfs.column_path, prop: 'paths', showLockedStatus: true, always_display: true,
    },
    { name: helptext_sharing_nfs.column_comment, prop: 'comment' },
    { name: helptext_sharing_nfs.column_enabled, prop: 'enabled', checkbox: true },
  ];
  rowIdentifier = 'nfs_paths';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Unix (NFS) Share',
      key_props: ['paths'],
    },
  };

  constructor(
    private modalService: ModalService,
    protected ws: WebSocketService,
    private dialog: DialogService,
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
    buildTitle: (share: NfsShare) => `${T('Unshare')} ${share.paths.join(', ')}`,
  };

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(NFSFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }

  onCheckboxChange(row: NfsShare): void {
    this.ws.call(this.updateCall, [row.id, { enabled: row.enabled }])
      .pipe(untilDestroyed(this))
      .subscribe(
        (res) => {
          row.enabled = res.enabled;
        },
        (err) => {
          row.enabled = !row.enabled;
          new EntityUtils().handleWSError(this, err, this.dialog);
        },
      );
  }
}

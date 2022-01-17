import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { shared, helptextSharingNfs } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebSocketService, ModalService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { NfsFormComponent } from '../nfs-form/nfs-form.component';

@UntilDestroy()
@Component({
  selector: 'app-nfs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class NfsListComponent implements EntityTableConfig<NfsShare> {
  title = this.translate.instant('NFS');
  queryCall = 'sharing.nfs.query' as const;
  updateCall = 'sharing.nfs.update' as const;
  wsDelete = 'sharing.nfs.delete' as const;
  routeAdd: string[] = ['sharing', 'nfs', 'add'];
  routeAddTooltip = this.translate.instant('Add Unix (NFS) Share');
  routeEdit: string[] = ['sharing', 'nfs', 'edit'];
  protected routeDelete: string[] = ['sharing', 'nfs', 'delete'];
  entityList: EntityTableComponent;

  columns = [
    {
      name: this.translate.instant(helptextSharingNfs.column_path), prop: 'paths', showLockedStatus: true, always_display: true,
    },
    { name: this.translate.instant(helptextSharingNfs.column_comment), prop: 'comment' },
    { name: this.translate.instant(helptextSharingNfs.column_enabled), prop: 'enabled', checkbox: true },
  ];
  rowIdentifier = 'nfs_paths';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Unix (NFS) Share'),
      key_props: ['paths'],
    },
  };

  constructor(
    private modalService: ModalService,
    protected ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
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
    button: this.translate.instant('Unshare'),
    buildTitle: (share: NfsShare) => `${this.translate.instant('Unshare')} ${share.paths.join(', ')}`,
  };

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(NfsFormComponent, id);
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
          new EntityUtils().handleWsError(this, err, this.dialog);
        },
      );
  }
}

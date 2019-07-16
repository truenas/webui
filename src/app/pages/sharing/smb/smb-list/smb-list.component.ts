import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { helptext_sharing_smb } from 'app/helptext/sharing';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { DialogService, WebSocketService, AppLoaderService } from 'app/services';
import { map, filter, switchMap, tap } from 'rxjs/operators';
import { EntityUtils } from 'app/pages/common/entity/utils';
 
@Component({
  selector : 'app-smb-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SMBListComponent {

  public title = "Samba";
  protected resource_name: string = 'sharing/cifs/';
  protected wsDelete = 'sharing.smb.delete';
  protected route_add: string[] = [ 'sharing', 'smb', 'add' ];
  protected route_add_tooltip: string = "Add Windows (SMB) Share";
  protected route_edit: string[] = [ 'sharing', 'smb', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'smb', 'delete' ];
  protected entityList: EntityTableComponent;

  public columns: any[] = [
    {name: helptext_sharing_smb.column_name, prop: 'cifs_name'},
    {name: helptext_sharing_smb.column_path, prop: 'cifs_path'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Windows (SMB) Share',
      key_props: ['cifs_name']
    },
  };

  constructor(private ws: WebSocketService, private router: Router, private dialogService: DialogService) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(): any[] {
    return [
      {
        id: "edit",
        label: "Edit",
        onClick: row => this.entityList.doEdit(row.id)
      },
      {
        id: "edit_acl",
        label: helptext_sharing_smb.action_edit_acl,
        onClick: row => {
          const datasetId = row.cifs_path.replace("/mnt/", "");
          this.ws
            .call("pool.dataset.query", [[["id", "=", datasetId]]])
            .pipe(map(datasets => datasets[0]))
            .subscribe(
              dataset =>
                this.router.navigate(
                  ["/"].concat(["storage", "pools", "id", dataset.pool, "dataset", "acl", datasetId])
                ),
              error => new EntityUtils().handleWSError(this, error, this.dialogService)
            );
        }
      },
      {
        id: 'delete',
        label: 'Delete',
        onClick: row =>
          this.dialogService
            .confirm(
              helptext_sharing_smb.dialog_delete_title,
              helptext_sharing_smb.dialog_delete_message.replace('?', ` ${row.cifs_name}?`)
            )
            .pipe(filter(ok => !!ok))
            .subscribe(
              () => this.entityList.delete(row.id),
              error => new EntityUtils().handleWSError(this, error, this.dialogService)
            )
      }
    ];
  }
}

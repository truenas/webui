import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { shared, helptext_sharing_smb } from 'app/helptext/sharing';
import vol_helptext  from 'app/helptext/storage/volumes/volume-list';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';
import { map } from 'rxjs/operators';
 
@Component({
  selector : 'app-smb-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SMBListComponent {

  public title = "Samba";
  protected queryCall: string = 'sharing.smb.query';
  protected wsDelete = 'sharing.smb.delete';
  protected route_add: string[] = [ 'sharing', 'smb', 'add' ];
  protected route_add_tooltip: string = "Add Windows (SMB) Share";
  protected route_edit: string[] = [ 'sharing', 'smb', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'smb', 'delete' ];
  private entityList: EntityTableComponent;

  public columns: any[] = [
    {name: helptext_sharing_smb.column_name, prop: 'name', always_display: true },
    {name: helptext_sharing_smb.column_path, prop: 'path'},
    {name: helptext_sharing_smb.column_comment, prop: 'comment'}
  ];
  public rowIdentifier = 'cifs_name';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Windows (SMB) Share',
      key_props: ['name']
    },
  };

  public confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: T('Unshare'),
    buildTitle: share => `${T('Unshare')} ${share.name}`
  }

  constructor(private ws: WebSocketService, private router: Router, private dialogService: DialogService) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(row): any[] {
    let rowName = row.path.replace("/mnt/", "");
    let poolName = rowName.split('/')[0];
    let optionDisabled;
    rowName.includes('/') ? optionDisabled = false : optionDisabled = true;
    return [
      {
        id: row.name,
        icon: 'edit',
        name: "edit",
        label: "Edit",
        onClick: row => this.entityList.doEdit(row.id)
      },
      {
        id: row.name,
        icon: 'security',
        name: "edit_acl",
        disabled: optionDisabled,
        matTooltip: vol_helptext.acl_edit_msg,
        label: helptext_sharing_smb.action_edit_acl,
        onClick: row => {
          const datasetId = rowName;
          this.router.navigate(
            ["/"].concat(["storage", "pools", "id", poolName, "dataset", "acl", datasetId]));
        }
      },
      {
        id: row.name,
        icon: 'delete',
        name: "delete",
        label: "Delete",
        onClick: row => this.entityList.doDelete(row)
      }
    ];
  }
}

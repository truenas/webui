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
    let rowParts = rowName.split('/');
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
        name: "share_acl",
        label: helptext_sharing_smb.action_share_acl,
        onClick: row => {
          this.ws.call('smb.sharesec.query', [[["share_name", "=", row.name]]]).subscribe(
            (res) => {
              this.router.navigate(
                ["/"].concat(["sharing", "smb", "acl", res[0].id]));
            }
          );
        }
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
          const ACLRoute = ['storage', 'pools', 'id', poolName, 'dataset', 'acl', datasetId]
          this.ws.call('pool.dataset.query', [[["name", "=", poolName]]]).subscribe(pool => {
            // Legacy encryption
            if (pool.length === 0) {
              this.ws.call('pool.query', [[["name", "=", poolName]]]).subscribe(pool => {
                if (pool[0].status !== 'OFFLINE') { // Pool is probably locked
                  this.router.navigate(
                    ['/'].concat(ACLRoute)
                  )
                } else {
                  this.dialogService.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title,
                    `${helptext_sharing_smb.action_edit_acl_dialog.legacy_msg1} <i>${row.name}</i> 
                      ${helptext_sharing_smb.action_edit_acl_dialog.legacy_msg2}`);
                }   
              })
            } else {
              // ZFS Encryption
              if (pool[0].locked) { // Pool is locked
                this.dialogService.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title,
                  `${helptext_sharing_smb.action_edit_acl_dialog.lockedPool_msg1} <i>${row.name}</i> 
                    ${helptext_sharing_smb.action_edit_acl_dialog.lockedPool_msg2}`);
              } else {
                this.ws.call('pool.dataset.query', [[['name', '=', rowName]]]).subscribe(ds => {
                  if (ds.length === 0) {
                    console.log('folder?')
                  } else if (ds[0].locked) { // pool isn't locked but ds is locked
                  this.dialogService.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title,
                    `${helptext_sharing_smb.action_edit_acl_dialog.lockedDS_msg1} <i>${row.name}</i> 
                      ${helptext_sharing_smb.action_edit_acl_dialog.lockedDS_msg2}`);
                  } else {
                    this.router.navigate(
                      ["/"].concat(ACLRoute));
                  }
                })
              }
            }
          })
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

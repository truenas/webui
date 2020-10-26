import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { shared, helptext_sharing_smb } from 'app/helptext/sharing';
import vol_helptext  from 'app/helptext/storage/volumes/volume-list';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { DialogService, WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';
 
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
  productType = window.localStorage.getItem('product_type');

  public columns: any[] = [
    {name: helptext_sharing_smb.column_name, prop: 'name', always_display: true },
    {name: helptext_sharing_smb.column_path, prop: 'path'},
    {name: helptext_sharing_smb.column_comment, prop: 'comment'},
    {name: helptext_sharing_smb.column_enabled, prop: 'enabled'}
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

  constructor(private ws: WebSocketService, private router: Router, 
    private dialogService: DialogService, private translate: TranslateService) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(row): any[] {
    let rowName = row.path.replace("/mnt/", "");
    let poolName = rowName.split('/')[0];
    let optionDisabled;
    rowName.includes('/') ? optionDisabled = false : optionDisabled = true;
    const rows =  [
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
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).subscribe(
            res => {
              if(res) {
                this.lockedPathDialog(row.path);
              } else {
                // A home share has a name (homes) set; row.name works for other shares
                const searchName = row.home ? 'homes' : row.name;
                this.ws.call('smb.sharesec.query', [[["share_name", "=", searchName]]]).subscribe(
                  (res) => {
                    this.router.navigate(
                      ["/"].concat(["sharing", "smb", "acl", res[0].id]));
                  }
                );
              }
            })
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
          this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).subscribe(
            res => {
            if(res) {
              this.lockedPathDialog(row.path);
            } else {
              if (this.productType.includes('SCALE')) {
                this.router.navigate(
                  ["/"].concat(["storage", "id", poolName, "dataset", "posix-acl", datasetId]));
              } else {
                this.router.navigate(
                  ["/"].concat(["storage", "pools", "id", poolName, "dataset", "acl", datasetId]));
              }
            }
          }, err => {
            this.dialogService.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title, 
              err.reason, err.trace.formatted);
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
    // Temporary: Drop from menu if SCALE
    if (this.productType.includes('SCALE')) {
      const shareAclRow = rows.find(row => row.name === 'share_acl')
      rows.splice(rows.indexOf(shareAclRow), 1);
    }
    return rows;
  }

  lockedPathDialog(path: string) {
    this.translate.get(helptext_sharing_smb.action_edit_acl_dialog.message1).subscribe(msg1 => {
      this.translate.get(helptext_sharing_smb.action_edit_acl_dialog.message2).subscribe(msg2 => {
        this.dialogService.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title, 
          `${msg1} <i>${path}</i> ${msg2}`)
      })
    })
  }
}

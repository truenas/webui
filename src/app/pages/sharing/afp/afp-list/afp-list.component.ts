import { Component } from '@angular/core';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { filter } from 'rxjs/operators';
import { T } from '../../../../translate-marker';
import { helptext_sharing_afp } from './../../../../helptext/sharing/afp/afp';

@Component({
  selector : 'app-afp-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class AFPListComponent {

  public title = "AFP (Apple File Protocol)";
  protected resource_name: string = 'sharing/afp/';
  protected wsDelete = 'sharing.afp.delete';
  protected route_add: string[] = [ 'sharing', 'afp', 'add' ];
  protected route_add_tooltip: string = "Add Apple (AFP) Share";
  protected route_edit: string[] = [ 'sharing', 'afp', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'afp', 'delete' ];
  protected entityList: EntityTableComponent;

  public columns: any[] = [
    {name : T('Name'), prop : 'afp_name'},
    {name : T('Path'), prop : 'afp_path'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Apple (AFP) Share',
      key_props: ['afp_name']
    },
  };

  constructor(private dialogService: DialogService) {}
  
  public afterInit(entityList: EntityTableComponent) {
    this.entityList = entityList;
  }


  public getActions() {
      return [
        {
          id: 'edit',
          label: 'Edit',
          onClick: share => this.entityList.doEdit(share.id)
        },
        {
          id: 'delete',
          label: 'Delete',
          onClick: share =>
            this.dialogService
              .confirm(
                helptext_sharing_afp.dialog_delete_title,
                helptext_sharing_afp.dialog_delete_message.replace('?', ` ${share.afp_name}?`)
              )
              .pipe(filter(ok => !!ok))
              .subscribe(
                () => this.entityList.delete(share.id),
                error => new EntityUtils().handleWSError(this, error, this.dialogService)
              )
        }
      ];
  }
}

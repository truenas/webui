import { Component } from '@angular/core';
import { delete_share_message } from 'app/helptext/sharing';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';
import { T } from '../../../../translate-marker';

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
  public confirmDeleteDialog = {
    message: delete_share_message + ' '
  }
  
  public afterInit(entityList: EntityTableComponent) {
    this.entityList = entityList;
  }
}

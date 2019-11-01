import { Component } from '@angular/core';
import { shared } from 'app/helptext/sharing';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-afp-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class AFPListComponent {

  public title = "AFP (Apple File Protocol)";
  protected queryCall: string = 'sharing.afp.query';
  protected wsDelete = 'sharing.afp.delete';
  protected route_add: string[] = [ 'sharing', 'afp', 'add' ];
  protected route_add_tooltip: string = "Add Apple (AFP) Share";
  protected route_edit: string[] = [ 'sharing', 'afp', 'edit' ];
  protected route_delete: string[] = [ 'sharing', 'afp', 'delete' ];

  public columns: any[] = [
    {name : T('Name'), prop : 'name', always_display: true},
    {name : T('Path'), prop : 'path'},
  ];
  public rowIdentifier = 'afp_name';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Apple (AFP) Share',
      key_props: ['name']
    },
  };

  public confirmDeleteDialog = {
    message: shared.delete_share_message,
    isMessageComplete: true,
    button: T('Unshare'),
    buildTitle: share => `${T('Unshare')} ${share.name}`
  }
}

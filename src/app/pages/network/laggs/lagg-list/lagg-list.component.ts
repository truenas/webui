import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-lagg-list',
  template: `<entity-list [conf]="this"></entity-list>`
})
export class LaggListComponent {

  protected resource_name: string = 'network/lagg/';
  protected route_add: string[] = ['network', 'laggs', 'add'];
  protected route_delete: string[] = ['network', 'laggs', 'delete'];

  constructor(protected rest: RestService, protected router: Router, protected state: GlobalState) {

  }

  public columns: Array<any> = [
    { title: 'Lagg Interface', name: 'lagg_interface' },
    { title: 'Lagg Protocol', name: 'lagg_protocol' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  getActions(row) {
    let actions = [];
    actions.push({
        label: "Delete",
        onClick: (row) => {
            this.router.navigate(new Array('/pages').concat(["network", "laggs", "delete", row.id]));
        },
    });
    return actions;
  }

}

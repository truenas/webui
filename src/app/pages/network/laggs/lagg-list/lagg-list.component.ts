import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import {RestService} from '../../../../services/rest.service';
import {EntityUtils} from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-lagg-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class LaggListComponent {

  public title = T("Link Aggregations");
  protected resource_name: string = 'network/lagg/';
  protected route_add: string[] = [ 'network', 'laggs', 'add' ];
  protected route_add_tooltip: string = "Add Link Aggregation";
  protected editIds: any = {};
  protected entityList: any;
  protected confirmDeleteDialog = {
    message: T("Network connectivity will be interrupted. Do you want to delete the selected interface?"),
  }

  constructor(protected rest: RestService, protected router: Router) {}

  public columns: Array<any> = [
    {name : T('Lagg Interface'), prop : 'lagg_interface'},
    {name : T('Lagg Protocol'), prop : 'lagg_protocol'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  getActions(row) {
    let actions = [];
    actions.push({
      label : T("Edit Interface"),
      onClick : (row) => {
        this.router.navigate(new Array('').concat([
          "network", "interfaces", "edit", this.editIds[row.lagg_interface]
        ]));
      }
    });
    actions.push({
      label : T("Edit Members"),
      onClick : (row) => {
        this.router.navigate(new Array('').concat([
          "network", "laggs", row.id, "members"
        ]));
      }
    });
    actions.push({
      label : T("Delete"),
      onClick : (row) => {
        this.entityList.doDelete(row.id);
      },
    });
    return actions;
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
    this.entityList.busy =
        this.rest.get('network/interface/', {}).subscribe((res) => {
          let interfaces = new EntityUtils().flattenData(res.data);
          let lagg_interface;
          for (let i = 0; i < entityList.rows.length; i++) {
            lagg_interface = entityList.rows[i]['lagg_interface'];
            this.editIds[lagg_interface] =
                _.find(interfaces, {'int_interface' : lagg_interface}).id;
          }
        });
  }
}

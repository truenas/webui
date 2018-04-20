import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import * as _ from 'lodash';

import {RestService} from '../../../../../services/rest.service';
import {EntityUtils} from '../../../../common/entity/utils';
import { T } from '../../../../../translate-marker';

@Component({
  selector : 'app-lagg-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class LaggMembersListComponent {

  public title = T("Link Aggregation Members");
  protected resource_name: string = 'network/lagginterfacemembers/';
  protected route_add: string[] = [];
  protected route_add_tooltip: string = "Add Link Aggregation Member";
  protected editIds: any = {};
  protected pk : any;
  protected entityList: any;

  protected lagg_interfacegroup: any;

  constructor(protected rest: RestService, protected router: Router, 
    protected route:ActivatedRoute) {}

  public columns: Array<any> = [
    {name : T('Lagg Interface Group'), prop : 'lagg_interfacegroup'},
    {name : T('Lagg Priority Number'), prop : 'lagg_ordernum'},
    {name : T('Physical NIC'), prop : 'lagg_physnic'},
    {name : T('Options'), prop: 'lagg_deviceoptions'}
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  getActions(row) {
    let actions = [];
    actions.push({
      label : T("Edit"),
      onClick : (row) => {
        this.router.navigate(new Array('').concat([
          "network", "laggs", this.pk, "members", row.id, "edit", row.lagg_physnic
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

  preInit(entityList: any) {
    this.entityList = entityList;
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.route_add = ["network", "laggs", this.pk, "members", "add"];
    });
    this.rest.get('/network/lagg/' + this.pk, {}).subscribe((res) => {
      this.lagg_interfacegroup = res.data['lagg_interface'] + ': ' + res.data['lagg_protocol'];
    });
  }

  resourceTransformIncomingRestData(data: any) {
    let members = [];
    for (let i=0; i < data.length; i++) {
      if (data[i]['lagg_interfacegroup'].toString() === this.pk.toString()) {
        let member = data[i];
        member['lagg_interfacegroup'] = this.lagg_interfacegroup;
        members.push(member);
      }
    }
    return members;
  }
}

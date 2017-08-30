import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IscsiService } from '../../../../../services/';
import * as _ from 'lodash';

@Component({
  selector : 'app-iscsi-associated-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `,
  providers: [IscsiService],
})
export class AssociatedTargetListComponent {

  protected resource_name: string = 'services/iscsi/targettoextent';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'add' ];
  protected route_add_tooltip: string = "Add Target/Extent";
  protected route_delete: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'delete' ];
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'edit' ];

  constructor(protected router: Router, protected iscsiService: IscsiService) {}

  public columns: Array<any> = [
    {
      name : 'Target',
      prop : 'iscsi_target_name',
    },
    {
      name : 'LUN ID',
      prop : 'iscsi_lunid',
    },
    {
      name : 'Extent',
      prop : 'iscsi_extent_name',
    }
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  afterInit(entityList: any) {}

  dataHandler(entityList: any) {
    this.iscsiService.getTargets().subscribe((res) => {
      let target_list = res.data;
      this.iscsiService.getExtents().subscribe((res) => {
        let extent_list = res.data;

        for (let i = 0; i < entityList.rows.length; i++) {
          entityList.rows[i].iscsi_target_name =  _.find(target_list, {id: entityList.rows[i].iscsi_target})['iscsi_target_name'];
          entityList.rows[i].iscsi_extent_name = _.find(extent_list, {id: entityList.rows[i].iscsi_extent})['iscsi_target_extent_name'];
        }
      });
    });
  }
}

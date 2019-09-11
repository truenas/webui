import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IscsiService } from '../../../../../services/';
import * as _ from 'lodash';
import { T } from 'app/translate-marker';
import { EntityUtils } from '../../../../common/entity/utils';

@Component({
  selector : 'app-iscsi-associated-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `,
  providers: [IscsiService],
})
export class AssociatedTargetListComponent {

  protected queryCall = 'iscsi.targetextent.query';
  protected wsDelete = 'iscsi.targetextent.delete';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'add' ];
  protected route_add_tooltip: string = "Add Target/Extent";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'associatedtarget', 'edit' ];

  public columns: Array<any> = [
    {
      name : 'Target',
      prop : 'target',
      always_display: true
    },
    {
      name : 'LUN ID',
      prop : 'lunid',
    },
    {
      name : 'Extent',
      prop : 'extent',
    }
  ];
  public rowIdentifier = 'target';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Target/Extent',
      key_props: ['target', 'extent']
    },
  };

  protected entityList: any;
  constructor(protected router: Router, protected iscsiService: IscsiService) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  dataHandler(entityList: any) {
    this.iscsiService.getTargets().subscribe((targets) => {
      const target_list = targets;
      this.iscsiService.getExtents().subscribe((res) => {
        const extent_list = res;

        for (let i = 0; i < entityList.rows.length; i++) {
          entityList.rows[i].target = _.find(target_list, {id: entityList.rows[i].target})['name'];
          entityList.rows[i].extent = _.find(extent_list, {id: entityList.rows[i].extent})['name'];
        }
      });
    });
  }
  getActions(row) {
    return [{
      id: row.target,
      name: 'edit',
      icon: 'edit',
      label: "Edit",
      onClick: (rowinner) => { this.entityList.doEdit(rowinner.id); },
    }, {
      id: row.target,
      name: 'delete',
      icon: 'delete',
      label: "Delete",
      onClick: (rowinner) => {
        let deleteMsg = this.entityList.getDeleteMessage(rowinner);
        this.iscsiService.getGlobalSessions().subscribe(
          (res) => {
            let warningMsg = '';
            for (let i = 0; i < res.length; i++) {
              if (res[i].target.split(':')[1] == rowinner.target) {
                warningMsg = '<font color="red">' + T('Warning: iSCSI Target is already in use.</font><br>');
              }
            }
            deleteMsg = warningMsg + deleteMsg;

            this.entityList.dialogService.confirm( T("Delete"), deleteMsg, false, T("Delete")).subscribe((dialres) => {
              if (dialres) {
                this.entityList.loader.open();
                this.entityList.loaderOpen = true;
                this.entityList.ws.call(this.wsDelete, [rowinner.id]).subscribe(
                  (resinner) => { this.entityList.getData() },
                  (resinner) => {
                    new EntityUtils().handleError(this, resinner);
                    this.entityList.loader.close();
                  }
                );
              }
            });
          }
        )
      }
    }];
  }
}

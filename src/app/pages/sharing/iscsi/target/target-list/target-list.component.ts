import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { IscsiService } from '../../../../../services/iscsi.service';
import { T } from 'app/translate-marker';

@Component({
  selector : 'app-iscsi-target-list',
  template : `
    <entity-table [conf]="this"></entity-table>
  `,
  providers: [IscsiService]
})
export class TargetListComponent {

  protected queryCall = 'iscsi.target.query';
  protected wsDelete = 'iscsi.target.delete';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'target', 'add' ];
  protected route_add_tooltip: string = "Add Target";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'target', 'edit' ];

  public columns: Array<any> = [
    {
      name : 'Target Name',
      prop : 'name',
    },
    {
      name : 'Target Alias',
      prop : 'alias',
    },
  ];6
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Target',
      key_props: ['name']
    },
  };

  protected iscsiSessions: any;
  constructor(private iscsiService: IscsiService) {
    this.iscsiService.getGlobalSessions().subscribe(
      (res) => {
        this.iscsiSessions = res;
      }
    )
  }

  warningMsg(item) {
    let warningMsg = '<font color="red">';
    for (let i = 0; i < this.iscsiSessions.length; i++) {
      if (this.iscsiSessions[i].target.split(':')[1] == item.name) {
        warningMsg += T('Warnning: Target in use');
        return warningMsg + '</font><br>';
      }
    }
  }
}

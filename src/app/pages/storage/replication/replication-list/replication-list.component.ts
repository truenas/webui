import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { RestService, WebSocketService } from '../../../../services/';


@Component({
  selector: 'app-replication-list',
  template: `<entity-table [title]="title"  [conf]="this"></entity-table>`
})
export class ReplicationListComponent {
  
  public title = "Replication";
  protected resource_name = 'storage/task';
  protected route_success: string[] = ['storage', 'replication'];
  protected entityList: any;

  public busy: Subscription;
  public sub: Subscription;
  public columns: Array<any> = [
    { name: 'id', prop: 'id' },
    { name: 'interv', prop: 'interv' },
    { name: 'keepfor', prop: 'keepfor' },
    { name: 'task_begin', prop: 'task_begin' },
    { name: 'task_byweekday', prop: 'task_byweekday' },
    { name: 'task_end', prop: 'task_end' },
    { name: 'task_filesystem', prop: 'task_filesystem' },
    { name: 'task_interval', prop: 'task_interval' },
    { name: 'task_recursive', prop: 'task_recursive' },
    { name: 'task_repeat_unit', prop: 'task_repeat_unit' },
    { name: 'task_ret_count', prop: 'task_ret_count' },
    { name: 'task_ret_unit', prop: 'task_ret_unit' },
    { name: 'vmwaresync', prop: 'vmwaresync' },
    { name: 'task_enabled', prop: 'task_enabled' }  ];
    
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) { }


  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => { });
  }

  getAddActions() {
    return [{
      label: "Replication",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["storage", "replication", "add-replication"]));
      }
    }];
  }

  getActions(parentRow) {
    return [{
      id: "edit",
      label: "Edit",
      onClick: (row) => {
        const urlNav = new Array<String>('').concat(['storage', 'replication', 'edit-replication', row.id]);
        this.router.navigate(urlNav);
      }
    },
    {
      id: "delete",
      label: "Delete",
      onClick: (row) => {
        this.entityList.doDelete(row.id);
      }
    }
    ]
  }

}

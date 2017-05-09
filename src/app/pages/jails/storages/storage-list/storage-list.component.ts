import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { Subscription } from 'rxjs';

import { EntityListComponent } from '../../../common/entity/entity-list/';

@Component({
  selector: 'app-storage-list',
  template: `
  <entity-list [conf]="this"></entity-list>
  `
})
export class StorageListComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_add: string[];
  protected entityList: EntityListComponent;
  protected pk: any;
  private sub: Subscription;

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService) {}

  public columns:Array<any> = [
    {title: 'Jail', name: 'jail'},
    {title: 'Source', name: 'source'},
    {title: 'Destination', name: 'destination'},
    {title: 'Mounted', name: 'mounted'},
    {title: 'Read-Only', name: 'readonly'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  afterInit(entityList: EntityListComponent) {
    this.entityList = entityList;
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.route_add = ['jails', this.pk, 'storages', 'add'];
    });
  }
}

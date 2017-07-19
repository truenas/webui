import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
  selector : 'import-list',
  template : `<entity-table [conf]="this"></entity-table>`
})

export class VolumeImportListComponent {
    protected resource_name: string = 'storage/volume_import';
    protected route_success: string[] = [ 'storage', 'volumes' ];
    public busy: Subscription;

    constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState
    ){}

    public columns: Array<any> = [
        {prop: 'label', name: 'Name'},
        {prop: 'type', name: 'Type'},
    ];

    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
    }


  getActions(row) {
    let actions = [];
    actions.push({
      label : "Import",
      onClick : (row) => {
        this.busy = this.rest.post(this.resource_name + '/', {
          body: JSON.stringify({"volume_id": row.id}),
        }).subscribe(
          (res) => {
            this.router.navigate(new Array('/pages').concat(this.route_success))
          },
          (res) => { new EntityUtils().handleError(this, res); }
        );
      }
    });
    return actions;
  }

}
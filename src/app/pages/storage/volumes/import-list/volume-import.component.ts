import {ApplicationRef, Component, Injector, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';
import { BaJob } from '../../../../theme/components';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { MdDialog, MdDialogRef } from '@angular/material';

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
              protected _state: GlobalState, protected dialog: MdDialog
    ){}

    public columns: Array<any> = [
        {prop: 'label', name: 'Name'},
        {prop: 'type', name: 'Type'},
    ];

    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
    }

  getAddActions() {
    let actions = [];
    actions.push({
      label: "Go Back",
      onClick: () => {
        this.router.navigate(
          new Array('/pages').concat(["storage", "volumes"]));
      }
    });
    return actions;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      label : "Import",
      onClick : (row) => {
        let dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "Importing Volume" } });
        dialogRef.componentInstance.post(this.resource_name + '/', {
          body: JSON.stringify({"volume_id": row.id}),
        });
      }
    });
    return actions;
  }

}
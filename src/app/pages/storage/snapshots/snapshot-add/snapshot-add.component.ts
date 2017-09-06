import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
   selector : 'snapshot-add',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class SnapshotAddComponent {

  protected resource_name: string = 'storage/snapshot';
  protected route_success: string[] = [ 'storage', 'volumes' ];
  protected isEntity: boolean = true;
  protected isNew: boolean = true;
  protected pk: any;

  protected fieldConfig: FieldConfig[];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => { 
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input', 
          name: 'name', 
          placeholder: 'Snapshot Name',
          value: "manual-" + moment().format('YYYYMMDD')
        },
        {
          type: 'input', 
          name: 'dataset', 
          placeholder: 'Dataset',
          value: this.pk,
          readonly: true
        },
        {
          type: 'checkbox',
          name : 'recursive',
          placeholder: 'Recursive'
        },
      ];
    });
  }
}

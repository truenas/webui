import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren,
  AfterViewInit
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import { RestService, WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-snapshot-add',
  templateUrl: './snapshot-add.component.html'
})

export class SnapshotAddComponent implements AfterViewInit {


  protected resource_name: string = 'storage/snapshot';
  protected route_success: string[] = ['storage', 'snapshots'];
  protected isEntity = true;
  protected isNew = true;
  protected fieldConfig: FieldConfig[] = [];
  public initialized = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {

    this.fieldConfig = [
      {
        type: 'select',
        name: 'dataset',
        placeholder: 'Volume/Dataset',
        tooltip: 'Select an existing ZFS volume, dataset, or zvol.',
        options: []
      },
      {
        type: 'input',
        name: 'name',
        placeholder: 'Name',
        tooltip: 'Add a name for the new snapshot',
        options: []
      },
      {
        type: 'checkbox',
        name: 'recursive',
        placeholder: 'Recursive',
        tooltip: 'Check this to include child datasets of the chosen dataset.',
      }
    ];


  }

  ngAfterViewInit(): void {


    this.rest.get("storage/volume/", {}).subscribe((res) => {
      const rows = new EntityUtils().flattenData(res.data);

      rows.forEach((dataItem) => {
        if (typeof (dataItem.path) !== 'undefined' && dataItem.path.length > 0) {
          this.fieldConfig[0].options.push({
            label: dataItem.path,
            value: dataItem.path
          });
        }
      })

      this.initialized = true;
    });
  }
}

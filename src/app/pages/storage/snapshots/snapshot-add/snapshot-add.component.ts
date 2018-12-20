import {
  ApplicationRef,
  Component,
  Injector,
  AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import { RestService, WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { Formconfiguration } from '../../../common/entity/entity-form/entity-form.component';
import helptext from '../../../../helptext/storage/snapshots/snapshots';

@Component({
  selector: 'app-snapshot-add',
  templateUrl: './snapshot-add.component.html'
})

export class SnapshotAddComponent implements AfterViewInit, Formconfiguration {

  public resource_name: string = 'storage/snapshot';
  public route_success: string[] = ['storage', 'snapshots'];
  public isEntity = true;
  public isNew = true;
  public fieldConfig: FieldConfig[] = [];
  public initialized = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {

    this.fieldConfig = [
      {
        type: 'select',
        name: 'dataset',
        placeholder: helptext.snapshot_add_dataset_placeholder,
        tooltip: helptext.snapshot_add_dataset_tooltip,
        options: [],
        validation: helptext.snapshot_add_dataset_validation,
        required: true
      },
      {
        type: 'input',
        name: 'name',
        placeholder: helptext.snapshot_add_name_placeholder,
        tooltip: helptext.snapshot_add_name_tooltip,
        options: [],
        validation: helptext.snapshot_add_name_validation,
        required: true
      },
      {
        type: 'checkbox',
        name: 'recursive',
        placeholder: helptext.snapshot_add_recursive_placeholder,
        tooltip: helptext.snapshot_add_recursive_tooltip,
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

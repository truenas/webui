import {
  ApplicationRef,
  Component,
  Injector,
  ViewChildren
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

import {RestService, WebSocketService} from '../../../../services/';

import * as _ from 'lodash';
import helptext from '../../../../helptext/storage/snapshots/snapshots';


@Component({
  selector : 'snapshot-clone',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class SnapshotCloneComponent {

  protected route_success: string[] = [ 'storage', 'pools' ];
  protected route_cancel: string[] = [ 'storage', 'snapshots' ];
  protected addCall = 'zfs.snapshot.clone';
  protected pk: any;
  protected isEntity: boolean = true;
  protected isNew: boolean = true;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.label_clone,
      class: 'clone',
      label:true,
      config: [
        {
          type: 'input',
          name: 'snapshot',
          placeholder: '',
          isHidden: true
        },
        {
          type: 'input',
          name: 'dataset_dst',
          placeholder: helptext.snapshot_clone_name_placeholder,
          tooltip: helptext.snapshot_clone_name_tooltip,
          required: true,
          validation : helptext.snapshot_clone_name_validation
        }
      ]
    }];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['dataset_dst'].setValue(this.setName(this.pk));
    entityForm.formGroup.controls['snapshot'].setValue(this.pk);
  }

  setName(name) {
    let value;
    if (name.indexOf('/') !== -1) {
      value = name.replace("@", "-") + "-clone";
    } else {
      value = name.replace("@", "/") + "-clone";
    }

    return value;
  }
}

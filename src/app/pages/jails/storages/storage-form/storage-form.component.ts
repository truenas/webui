import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { GlobalState } from '../../../../global.state';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-storage-add',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class StorageFormComponent {

  protected resource_name: string = 'jails/mountpoints/';
  protected route_success: string[] = ['jails', 'storage'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'jail',
      placeholder: 'Jail',
    },
    {
      type: 'input',
      name: 'source',
      placeholder: 'Source',
    },
    {
      type: 'input',
      name: 'destination',
      placeholder: 'Destination',
    },
    {
      type: 'checkbox',
      name: 'readonly',
      placeholder: 'Read-Only',
    },
    {
      type: 'checkbox',
      name: 'create directory',
      placeholder: 'Create directory',
    }
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

}
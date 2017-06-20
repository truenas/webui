import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { GlobalState } from '../../../../global.state';
import { JailService } from '../../../../services/';

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
      type: 'select',
      name: 'jail',
      placeholder: 'Jail',
      options: [],
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

  private jail: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, protected jailService: JailService) {

  }

  afterInit(entityForm: any) {
    this.jailService.listJails().subscribe((res) => {
      this.jail = _.find(this.fieldConfig, {'name': 'jail'});
      res.data.forEach((item) => {
        this.jail.options.push({ label: item.jail_host, value: item.jail_host});
      });
    });

    if (!entityForm.isNew) {
      entityForm.setDisabled('jail', true);
    }
  }
}
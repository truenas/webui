import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService } from '../../../../../services/';
import { T } from '../../../../../translate-marker';

@Component({
  selector: 'app-iscsi-associated-target-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ IscsiService ],
})
export class AssociatedTargetFormComponent {

  protected resource_name: string = 'services/iscsi/targettoextent';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'associatedtarget' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'iscsi_target',
      placeholder: T('Target'),
      tooltip: T('Select an existing target.'),
      options: [],
      value: '',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      name: 'iscsi_lunid',
      placeholder: T('LUN ID'),
      tooltip: T('Select the value or enter a value between\
                  <i>0</i> and <i>1023</i>. Some initiators\
                  expect a value below <i>256</i>. Using\
                  <i>0</i> statically assigns the next\
                  available ID.'),
      value: 0,
      validation: [ Validators.min(0), Validators.max(1023), Validators.pattern(/^(0|[1-9]\d*)$/) ],
    },
    {
      type: 'select',
      name: 'iscsi_extent',
      placeholder: T('Extent'),
      tooltip: T('Select an existing extent.'),
      options: [],
      value: '',
      required: true,
      validation : [ Validators.required ]
    },
  ];

  protected target_control: any;
  protected extent_control: any;
  protected lunid_control: any;

  constructor(protected router: Router, protected iscsiService: IscsiService) {}

  afterInit(entityForm: any) {
    this.target_control = _.find(this.fieldConfig, {'name' : 'iscsi_target'});
    this.target_control.options.push({label: '----------', value: ''});
    this.iscsiService.getTargets().subscribe((res) => {
      res.data.forEach((target) => {
        this.target_control.options.push({label: target.iscsi_target_name, value: target.id});
      })
    });

    this.extent_control = _.find(this.fieldConfig, {'name' : 'iscsi_extent'});
    this.extent_control.options.push({label: '----------', value: ''});
    this.iscsiService.getExtents().subscribe((res) => {
      res.data.forEach((extent) => {
        this.extent_control.options.push({label: extent.iscsi_target_extent_name, value: extent.id});
      })
    });
  }
}

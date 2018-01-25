import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService } from '../../../../../services/';

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
      placeholder: 'Target',
      tooltip: 'Select the pre-created target.',
      options: [],
      value: '',
    },
    {
      type: 'select',
      name: 'iscsi_lunid',
      placeholder: 'LUN ID',
      tooltip: 'Select the value to use or type in a value between\
 <i>1</i> and <i>1023</i>. Note that some initiators expect a value\
 below <i>256</i>.',
      options: [],
      value: 0,
    },
    {
      type: 'select',
      name: 'iscsi_extent',
      placeholder: 'Extent',
      tooltip: 'Select the pre-created extent.',
      options: [],
      value: '',
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
        console.log(extent);
        this.extent_control.options.push({label: extent.iscsi_target_extent_name, value: extent.id});
      })
    });

    this.lunid_control = _.find(this.fieldConfig, {'name' : 'iscsi_lunid'});
    for (let i = 0; i < 25; i++) {
      this.lunid_control.options.push({label: i, value: i});
    }
  }
}

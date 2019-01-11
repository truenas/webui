import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService } from '../../../../../services/';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

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
      placeholder: helptext_sharing_iscsi.associated_target_placeholder_target,
      tooltip: helptext_sharing_iscsi.associated_target_tooltip_target,
      options: [],
      value: '',
      required: true,
      validation : helptext_sharing_iscsi.associated_target_validators_target
    },
    {
      type: 'input',
      name: 'iscsi_lunid',
      placeholder: helptext_sharing_iscsi.associated_target_placeholder_lunid,
      tooltip: helptext_sharing_iscsi.associated_target_tooltip_lunid,
      value: 0,
      validation: helptext_sharing_iscsi.associated_target_validators_lunid,
    },
    {
      type: 'select',
      name: 'iscsi_extent',
      placeholder: helptext_sharing_iscsi.associated_target_placeholder_extent,
      tooltip: helptext_sharing_iscsi.associated_target_tooltip_extent,
      options: [],
      value: '',
      required: true,
      validation : helptext_sharing_iscsi.associated_target_validators_extent
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

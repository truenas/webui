import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { GlobalState } from '../../../../../global.state';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService } from '../../../../../services/';

@Component({
  selector: 'app-iscsi-associated-target-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ IscsiService ],
})
export class AssociatedTargetFormComponent {

  protected resource_name: string = 'services/iscsi/targettoextent';
  protected route_success: string[] = [ 'sharing', 'iscsi' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'iscsi_target',
      placeholder: 'Target',
      options: [],
      value: '',
    },
    {
      type: 'select',
      name: 'iscsi_lunid',
      placeholder: 'LUN ID',
      options: [],
      value: 0,
    },
    {
      type: 'select',
      name: 'iscsi_extent',
      placeholder: 'Extent',
      options: [],
      value: '',
    },
  ];

  protected target_control: any;
  protected extent_control: any;
  protected lunid_control: any;

  constructor(protected router: Router,
              protected _injector: Injector,
              protected _appRef: ApplicationRef,
              protected _state: GlobalState,
              protected iscsiService: IscsiService) {}

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

import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService, WebSocketService } from '../../../../../services/';
import { T } from '../../../../../translate-marker';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';

@Component({
  selector: 'app-iscsi-associated-target-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ IscsiService ],
})
export class AssociatedTargetFormComponent {

  protected addCall: string = 'iscsi.targetextent.create';
  protected queryCall: string = 'iscsi.targetextent.query';
  protected editCall = 'iscsi.targetextent.update';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'associatedtarget' ];
  protected isEntity: boolean = true;
  protected customFilter: Array<any> = [[["id", "="]]];

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'target',
      placeholder: T('Target'),
      tooltip: T('Select an existing target.'),
      options: [],
      value: '',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      name: 'lunid',
      placeholder: T('LUN ID'),
      tooltip: T('Select the value or enter a value between\
                  <i>0</i> and <i>1023</i>. Some initiators\
                  expect a value below <i>256</i>.'),
      value: 0,
      validation: [ Validators.min(0), Validators.max(1023), Validators.pattern(/^(0|[1-9]\d*)$/) ],
    },
    {
      type: 'select',
      name: 'extent',
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
  protected pk: any;
  protected entityForm: any;

  constructor(protected router: Router, protected iscsiService: IscsiService, protected aroute: ActivatedRoute,
              protected loader: AppLoaderService, protected ws: WebSocketService) {}

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.target_control = _.find(this.fieldConfig, {'name' : 'target'});
    this.target_control.options.push({label: '----------', value: ''});
    this.iscsiService.getTargets().subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.target_control.options.push({label: res[i].name, value: res[i].id});
      }
    });

    this.extent_control = _.find(this.fieldConfig, {'name' : 'extent'});
    this.extent_control.options.push({label: '----------', value: ''});
    this.iscsiService.getExtents().subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.extent_control.options.push({label: res[i].name, value: res[i].id});
      }
    });
  }

  customEditCall(value) {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      }
    );

  }
}

import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService, WebSocketService } from '../../../../../services/';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

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
      placeholder: helptext_sharing_iscsi.associated_target_placeholder_target,
      tooltip: helptext_sharing_iscsi.associated_target_tooltip_target,
      options: [],
      value: '',
      required: true,
      validation : helptext_sharing_iscsi.associated_target_validators_target
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'lunid',
      placeholder: helptext_sharing_iscsi.associated_target_placeholder_lunid,
      tooltip: helptext_sharing_iscsi.associated_target_tooltip_lunid,
      value: '',
      validation: helptext_sharing_iscsi.associated_target_validators_lunid,
    },
    {
      type: 'select',
      name: 'extent',
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

  beforeSubmit(value) {
    if (value['lunid'] === "") {
      delete value['lunid'];
    }
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

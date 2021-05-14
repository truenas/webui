import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';

import { FieldSet } from '../../../../common/entity/entity-form/models/fieldset.interface';
import { IscsiService, WebSocketService } from '../../../../../services';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'app-iscsi-associated-target-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [IscsiService],
})
export class AssociatedTargetFormComponent implements FormConfiguration {
  addCall: 'iscsi.targetextent.create' = 'iscsi.targetextent.create';
  queryCall: 'iscsi.targetextent.query' = 'iscsi.targetextent.query';
  editCall: 'iscsi.targetextent.update' = 'iscsi.targetextent.update';
  route_success: string[] = ['sharing', 'iscsi', 'associatedtarget'];
  isEntity = true;
  customFilter: any[] = [[['id', '=']]];

  fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_iscsi.fieldset_associated_target,
      label: true,
      class: 'associated_target',
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'target',
          placeholder: helptext_sharing_iscsi.associated_target_placeholder_target,
          tooltip: helptext_sharing_iscsi.associated_target_tooltip_target,
          options: [],
          value: '',
          required: true,
          validation: helptext_sharing_iscsi.associated_target_validators_target,
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
          validation: helptext_sharing_iscsi.associated_target_validators_extent,
        },
      ],
    },
  ];

  fieldConfig: FieldConfig[];

  protected target_control: any;
  protected extent_control: any;
  pk: any;
  protected entityForm: any;

  constructor(protected router: Router, protected iscsiService: IscsiService, protected aroute: ActivatedRoute,
    protected loader: AppLoaderService, protected ws: WebSocketService) {}

  preInit(): void {
    this.aroute.params.subscribe((params) => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk'], 10));
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;

    this.target_control = _.find(this.fieldConfig, { name: 'target' });
    this.target_control.options.push({ label: '----------', value: '' });
    this.iscsiService.getTargets().subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.target_control.options.push({ label: res[i].name, value: res[i].id });
      }
    });

    this.extent_control = _.find(this.fieldConfig, { name: 'extent' });
    this.extent_control.options.push({ label: '----------', value: '' });
    this.iscsiService.getExtents().subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.extent_control.options.push({ label: res[i].name, value: res[i].id });
      }
    });
  }

  beforeSubmit(value: any): void {
    if (value['lunid'] === '') {
      delete value['lunid'];
    }
  }

  customEditCall(value: any): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      },
    );
  }
}

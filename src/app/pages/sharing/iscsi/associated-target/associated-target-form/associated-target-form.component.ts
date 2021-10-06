import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IscsiTargetExtent, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { IscsiService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
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
  customFilter: [[Partial<QueryFilter<IscsiTargetExtent>>]] = [[['id', '=']]];

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

  protected target_control: FormSelectConfig;
  protected extent_control: FormSelectConfig;
  pk: number;
  protected entityForm: EntityFormComponent;

  constructor(protected router: Router, protected iscsiService: IscsiService, protected aroute: ActivatedRoute,
    protected loader: AppLoaderService, protected ws: WebSocketService) {}

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk'], 10));
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;

    this.target_control = _.find(this.fieldConfig, { name: 'target' }) as FormSelectConfig;
    this.target_control.options.push({ label: '----------', value: '' });
    this.iscsiService.getTargets().pipe(untilDestroyed(this)).subscribe((targets) => {
      targets.forEach((target) => {
        this.target_control.options.push({ label: target.name, value: target.id });
      });
    });

    this.extent_control = _.find(this.fieldConfig, { name: 'extent' }) as FormSelectConfig;
    this.extent_control.options.push({ label: '----------', value: '' });
    this.iscsiService.getExtents().pipe(untilDestroyed(this)).subscribe((extents) => {
      extents.forEach((extent) => {
        this.extent_control.options.push({ label: (extent).name, value: (extent).id });
      });
    });
  }

  beforeSubmit(value: any): void {
    if (value['lunid'] === '') {
      delete value['lunid'];
    }
  }

  customEditCall(value: IscsiTargetExtentUpdate): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
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

import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Overwrite } from 'utility-types';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IscsiTargetExtent, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IscsiService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-associated-target-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [IscsiService],
})
export class AssociatedTargetFormComponent implements FormConfiguration {
  addCall = 'iscsi.targetextent.create' as const;
  queryCall = 'iscsi.targetextent.query' as const;
  editCall = 'iscsi.targetextent.update' as const;
  routeSuccess: string[] = ['sharing', 'iscsi', 'associatedtarget'];
  isEntity = true;
  customFilter: [[Partial<QueryFilter<IscsiTargetExtent>>]] = [[['id', '=']]];

  fieldSets: FieldSet[] = [
    {
      name: helptextSharingIscsi.fieldset_associated_target,
      label: true,
      class: 'associated_target',
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'target',
          placeholder: helptextSharingIscsi.associated_target_placeholder_target,
          tooltip: helptextSharingIscsi.associated_target_tooltip_target,
          options: [],
          value: '',
          required: true,
          validation: helptextSharingIscsi.associated_target_validators_target,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'lunid',
          placeholder: helptextSharingIscsi.associated_target_placeholder_lunid,
          tooltip: helptextSharingIscsi.associated_target_tooltip_lunid,
          value: '',
          validation: helptextSharingIscsi.associated_target_validators_lunid,
        },
        {
          type: 'select',
          name: 'extent',
          placeholder: helptextSharingIscsi.associated_target_placeholder_extent,
          tooltip: helptextSharingIscsi.associated_target_tooltip_extent,
          options: [],
          value: '',
          required: true,
          validation: helptextSharingIscsi.associated_target_validators_extent,
        },
      ],
    },
  ];

  fieldConfig: FieldConfig[];

  protected targetControlField: FormSelectConfig;
  protected extentControlField: FormSelectConfig;
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

    this.targetControlField = _.find(this.fieldConfig, { name: 'target' }) as FormSelectConfig;
    this.targetControlField.options.push({ label: '----------', value: '' });
    this.iscsiService.getTargets().pipe(untilDestroyed(this)).subscribe((targets) => {
      targets.forEach((target) => {
        this.targetControlField.options.push({ label: target.name, value: target.id });
      });
    });

    this.extentControlField = _.find(this.fieldConfig, { name: 'extent' }) as FormSelectConfig;
    this.extentControlField.options.push({ label: '----------', value: '' });
    this.iscsiService.getExtents().pipe(untilDestroyed(this)).subscribe((extents) => {
      extents.forEach((extent) => {
        this.extentControlField.options.push({ label: (extent).name, value: (extent).id });
      });
    });
  }

  beforeSubmit(value: Overwrite<IscsiTargetExtent, { lunid: string }>): void {
    if (value['lunid'] === '') {
      delete value['lunid'];
    }
  }

  customEditCall(value: IscsiTargetExtentUpdate): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWsError(this.entityForm, res);
      },
    );
  }
}

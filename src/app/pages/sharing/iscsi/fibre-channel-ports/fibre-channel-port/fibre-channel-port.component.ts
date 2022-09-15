import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { FibreChannelPortMode } from 'app/enums/fibre-channel-port-mode.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { FibreChannelPortUpdate } from 'app/interfaces/fibre-channel-port.interface';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  WebSocketService, IscsiService, AppLoaderService, DialogService,
} from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './fibre-channel-port.component.html',
  styleUrls: ['./fibre-channel-port.component.scss', '../../../../../modules/entity/entity-form/entity-form.component.scss'],
  providers: [IscsiService],
})
export class FibreChannelPortComponent implements OnInit {
  @Input() config: Partial<FibreChannelPortUpdate> & { id: string; name: string };

  fieldSets: FieldSet[] = [
    {
      name: '',
      class: '',
      label: true,
      width: '50%',
      config: [
        {
          type: 'radio',
          name: 'mode',
          placeholder: helptextSharingIscsi.fc_mode_placeholder,
          tooltip: helptextSharingIscsi.fc_mode_tooltip,
          options: [
            {
              label: 'Initiator',
              value: FibreChannelPortMode.Initiator,
            },
            {
              label: 'Target',
              value: FibreChannelPortMode.Target,
            },
            {
              label: 'Disabled',
              value: FibreChannelPortMode.Disabled,
            },
          ],
        },
      ],
    },
    {
      name: '',
      class: '',
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'target',
          placeholder: helptextSharingIscsi.fc_target_placeholder,
          tooltip: helptextSharingIscsi.fc_target_tooltip,
          options: [{
            label: '---------',
            value: null,
          }],
          value: null,
        },
        {
          type: 'textarea',
          name: 'initiators',
          placeholder: helptextSharingIscsi.fc_initiators_placeholder,
          tooltip: helptextSharingIscsi.fc_initiators_tooltip,
        },
      ],
    },
  ];
  fieldConfig: FieldConfig[] = [];
  formGroup: UntypedFormGroup;

  constructor(
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    private iscsiService: IscsiService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
  ) {
    const targetField = _.find(this.fieldSets[1].config, { name: 'target' }) as FormSelectConfig;
    this.iscsiService.getTargets().pipe(untilDestroyed(this)).subscribe({
      next: (targets) => {
        targetField.options = targets.map((target) => {
          return {
            label: target.name,
            value: target.id,
          };
        });
      },
      error: (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    });
  }

  ngOnInit(): void {
    this.fieldSets.forEach((fieldset) => {
      if (fieldset.config) {
        this.fieldConfig = this.fieldConfig.concat(fieldset.config);
      }
    });
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    const targetField = _.find(this.fieldConfig, { name: 'target' });
    this.formGroup.controls['mode'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      targetField.required = res === FibreChannelPortMode.Target;
      if (res === FibreChannelPortMode.Target) {
        this.formGroup.controls['target'].setValidators([Validators.required]);
        this.formGroup.controls['target'].updateValueAndValidity();
      } else {
        this.formGroup.controls['target'].clearValidators();
        this.formGroup.controls['target'].updateValueAndValidity();
      }
    });
    for (const i in this.config) {
      if (this.formGroup.controls[i]) {
        this.formGroup.controls[i].setValue(this.config[i as keyof FibreChannelPortUpdate]);
      }
    }
  }

  isShow(field: string): boolean {
    if (field === 'target' || field === 'initiators') {
      return this.formGroup.controls['mode'].value === FibreChannelPortMode.Target;
    }
    return true;
  }

  onSubmit(): void {
    const value = _.cloneDeep(this.formGroup.value);
    delete value['initiators'];

    if (value['mode'] !== FibreChannelPortMode.Target) {
      value['target'] = null;
    }
    this.loader.open();
    this.ws.call('fcport.update', [this.config.id, value]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.dialogService.info(
          this.translate.instant('Updated'),
          this.translate.instant('Fibre Channel Port {name} update successful.', { name: this.config.name }),
        );
      },
      error: (err) => {
        this.loader.close();
        this.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted);
      },
    });
  }
}

import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptextSharingSmb } from 'app/helptext/sharing/smb/smb';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { SmbSharesec } from 'app/interfaces/smb-share.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FormListConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

@UntilDestroy()
@Component({
  selector: 'app-smb-acl',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SMBAclComponent implements FormConfiguration {
  queryCall = 'smb.sharesec.query' as const;
  editCall = 'smb.sharesec.update' as const;

  routeSuccess: string[] = ['sharing', 'smb'];
  isEntity = true;
  customFilter: QueryParams<SmbSharesec>;

  fieldSets: FieldSet[] = [
    {
      name: helptextSharingSmb.share_acl_basic,
      label: true,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'share_name',
          placeholder: helptextSharingSmb.share_name_placeholder,
          tooltip: helptextSharingSmb.share_name_tooltip,
          readonly: true,
        },
      ],
    },
    {
      name: helptextSharingSmb.share_acl_entries,
      label: true,
      class: 'entries',
      width: '100%',
      config: [
        {
          type: 'list',
          name: 'share_acl',
          width: '100%',
          listFields: [],
          templateListField: [
            {
              type: 'input',
              name: 'ae_who_sid',
              placeholder: helptextSharingSmb.ae_who_sid_placeholder,
              tooltip: helptextSharingSmb.ae_who_sid_tooltip,
              required: true,
              validation: [Validators.required],
            },
            {
              type: 'input',
              name: 'ae_who_name_domain',
              placeholder: helptextSharingSmb.ae_who_name_domain_placeholder,
              tooltip: helptextSharingSmb.ae_who_name_domain_tooltip,
              class: 'inline',
              width: '50%',
            },
            {
              type: 'input',
              name: 'ae_who_name_name',
              placeholder: helptextSharingSmb.ae_who_name_name_placeholder,
              tooltip: helptextSharingSmb.ae_who_name_name_tooltip,
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'ae_perm',
              placeholder: helptextSharingSmb.ae_perm_placeholder,
              tooltip: helptextSharingSmb.ae_perm_tooltip,
              options: [
                {
                  label: 'FULL',
                  value: 'FULL',
                },
                {
                  label: 'CHANGE',
                  value: 'CHANGE',
                },
                {
                  label: 'READ',
                  value: 'READ',
                },
              ],
              required: true,
              validation: [Validators.required],
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'ae_type',
              placeholder: helptextSharingSmb.ae_type_placeholder,
              tooltip: helptextSharingSmb.ae_type_tooltip,
              options: [
                {
                  label: 'ALLOWED',
                  value: 'ALLOWED',
                },
                {
                  label: 'DENIED',
                  value: 'DENIED',
                },
              ],
              required: true,
              validation: [Validators.required],
              class: 'inline',
              width: '50%',
            },
          ],
        },

      ],
    },
  ];

  protected shareAclField: FormListConfig;
  protected entityForm: EntityFormComponent;

  constructor(private aroute: ActivatedRoute) { }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        this.customFilter = [[['id', '=', parseInt(params['pk'], 10)]]];
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.shareAclField = _.find(entityForm.fieldConfig, { name: 'share_acl' }) as FormListConfig;

    entityForm.formGroup.controls['share_acl'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        if (res[i].ae_who_sid !== undefined && res[i].ae_who_sid !== '') {
          const sidField = _.find(this.shareAclField['listFields'][i], { name: 'ae_who_sid' });
          if (!sidField.required) {
            this.updateRequiredValidator('ae_who_sid', i, true);
            this.updateRequiredValidator('ae_who_name_domain', i, false);
            this.updateRequiredValidator('ae_who_name_name', i, false);
          }
        } else if (res[i].ae_who_name_domain !== undefined && res[i].ae_who_name_domain !== ''
                || res[i].ae_who_name_name !== undefined && res[i].ae_who_name_name !== '') {
          const domainField = _.find(this.shareAclField['listFields'][i], { name: 'ae_who_name_domain' });
          const nameField = _.find(this.shareAclField['listFields'][i], { name: 'ae_who_name_name' });
          if (!domainField.required || !nameField.required) {
            this.updateRequiredValidator('ae_who_sid', i, false);
            this.updateRequiredValidator('ae_who_name_domain', i, true);
            this.updateRequiredValidator('ae_who_name_name', i, true);
          }
        }
      }
    });
  }

  updateRequiredValidator(fieldName: string, index: number, required: boolean): void {
    const fieldCtrl = ((this.entityForm.formGroup.controls['share_acl'] as FormGroup).controls[index] as FormGroup).controls[fieldName];
    const fieldConfig = _.find(this.shareAclField['listFields'][index], { name: fieldName });
    if (fieldConfig.required !== required) {
      fieldConfig.required = required;
      if (required) {
        fieldCtrl.setValidators([Validators.required]);
      } else {
        fieldCtrl.clearValidators();
      }
      fieldCtrl.updateValueAndValidity();
    }
  }

  resourceTransformIncomingRestData(data: any): any {
    data.share_acl.forEach((acl: any) => {
      if (acl['ae_who_name']) {
        acl['ae_who_name_domain'] = acl['ae_who_name']['domain'];
        acl['ae_who_name_name'] = acl['ae_who_name']['name'];
        delete acl['ae_who_name'];
      }
    });
    return data;
  }

  beforeSubmit(data: any): void {
    delete data['share_name'];
    for (const acl of data.share_acl) {
      if (acl['ae_who_sid'] !== undefined && acl['ae_who_sid'] !== '') {
        delete acl['ae_who_name_domain'];
        delete acl['ae_who_name_name'];
      } else {
        acl['ae_who_name'] = {
          domain: acl['ae_who_name_domain'],
          name: acl['ae_who_name_name'],
        };
        delete acl['ae_who_name_domain'];
        delete acl['ae_who_name_name'];
        delete acl['ae_who_sid'];
      }
    }
  }
}

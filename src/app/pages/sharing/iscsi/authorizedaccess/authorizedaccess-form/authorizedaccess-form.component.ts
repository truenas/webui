import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { matchOtherValidator, doesNotEqualValidator } from 'app/pages/common/entity/entity-form/validators/password-validation/password-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-authorizedaccess-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class AuthorizedAccessFormComponent implements FormConfiguration {
  addCall = 'iscsi.auth.create' as const;
  queryCall = 'iscsi.auth.query' as const;
  editCall = 'iscsi.auth.update' as const;
  route_success: string[] = ['sharing', 'iscsi', 'auth'];
  isEntity = true;
  customFilter: [[Partial<QueryFilter<IscsiAuthAccess>>]] = [[['id', '=']]];

  fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_iscsi.fieldset_group,
      label: true,
      class: 'group',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'tag',
          placeholder: helptext_sharing_iscsi.authaccess_placeholder_tag,
          tooltip: helptext_sharing_iscsi.authaccess_tooltip_tag,
          inputType: 'number',
          min: 0,
          required: true,
          validation: [Validators.required, Validators.min(0)],
        },
      ],
    },
    {
      name: helptext_sharing_iscsi.fieldset_user,
      label: true,
      class: 'user',
      width: '49%',
      config: [{
        type: 'input',
        name: 'user',
        placeholder: helptext_sharing_iscsi.authaccess_placeholder_user,
        tooltip: helptext_sharing_iscsi.authaccess_tooltip_user,
        validation: [Validators.required],
        required: true,
      },
      {
        type: 'input',
        name: 'secret',
        placeholder: helptext_sharing_iscsi.authaccess_placeholder_secret,
        tooltip: helptext_sharing_iscsi.authaccess_tooltip_secret,
        inputType: 'password',
        togglePw: true,
        required: true,
        validation: [
          Validators.minLength(12),
          Validators.maxLength(16),
          Validators.required,
          matchOtherValidator('secret_confirm'),
        ],
      },
      {
        type: 'input',
        name: 'secret_confirm',
        placeholder: helptext_sharing_iscsi.authaccess_placeholder_secret_confirm,
        inputType: 'password',
      }],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_sharing_iscsi.fieldset_peeruser,
      label: true,
      class: 'peeruser',
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'peeruser',
          placeholder: helptext_sharing_iscsi.authaccess_placeholder_peeruser,
          tooltip: helptext_sharing_iscsi.authaccess_tooltip_peeruser,
        },
        {
          type: 'input',
          name: 'peersecret',
          placeholder: helptext_sharing_iscsi.authaccess_placeholder_peersecret,
          tooltip: helptext_sharing_iscsi.authaccess_tooltip_peersecret,
          inputType: 'password',
          togglePw: true,
          validation: [
            Validators.minLength(12),
            Validators.maxLength(16),
            doesNotEqualValidator('secret'),
            matchOtherValidator('peersecret_confirm'),
          ],
        },
        {
          type: 'input',
          name: 'peersecret_confirm',
          placeholder: helptext_sharing_iscsi.authaccess_placeholder_peersecret_confirm,
          inputType: 'password',
        },
      ],
    },
  ];

  pk: number;

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected loader: AppLoaderService,
    protected ws: WebSocketService) {}

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk'], 10));
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    const secretControl = entityForm.formGroup.controls['secret'] as FormControl;
    const peersecretControl = entityForm.formGroup.controls['peersecret'] as FormControl;
    const peeruserFieldset = _.find(this.fieldSets, { class: 'peeruser' });
    const peersecretConfig = _.find(peeruserFieldset.config, { name: 'peersecret' });

    entityForm.formGroup.controls['peeruser'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != '') {
        peersecretControl.setValidators([
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(16),
          matchOtherValidator('peersecret_confirm'),
          doesNotEqualValidator('secret'),
        ]);
        peersecretConfig.required = true;
      } else {
        peersecretControl.clearValidators();
        peersecretConfig.required = false;
      }
      peersecretControl.updateValueAndValidity();
    });

    [secretControl, peersecretControl].forEach((ctrl, index) => {
      ctrl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
        let errors = ctrl.errors;
        const compartedCtrlName = index === 0 ? 'peersecret' : 'secret';
        const otherCtrl = entityForm.formGroup.controls[compartedCtrlName];
        const otherErrors = otherCtrl.errors;
        if (res === otherCtrl.value) {
          if (!ctrl.hasError('manualValidateError')) {
            if (errors === null) {
              errors = {
                manualValidateError: true,
                manualValidateErrorMsg: helptext_sharing_iscsi.authaccess_error_duplicate_secrets,
              };
            } else {
              errors['manualValidateError'] = true;
              errors['manualValidateErrorMsg'] = helptext_sharing_iscsi.authaccess_error_duplicate_secrets;
            }
          }
        } else {
          if (ctrl.hasError('manualValidateError')) {
            delete errors['manualValidateError'];
            delete errors['manualValidateErrorMsg'];
          }
          // If the error gets cleared in this comparison validator, make sure it is cleared for both fields
          setTimeout(() => {
            // 'Resets' the other control with its same value to get angular to check it again
            otherCtrl.setValue(otherCtrl.value);
          }, 100);
        }
        ctrl.setErrors(errors);
        otherCtrl.setErrors(otherErrors);
      });
    });
  }

  beforeSubmit(value: any): void {
    delete value['secret_confirm'];
    delete value['peersecret_confirm'];
  }

  customEditCall(value: any): void {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, res);
      },
    );
  }
}

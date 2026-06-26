import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface SedConfig {
  sedPassword: string;
}

export interface SedFormValues {
  sed_passwd: string;
  sed_passwd2: string;
}

export function getSelfEncryptingDriveFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
): FormDefinition<SedFormValues> {
  return {
    title: helptextSystemAdvanced.sedTitle,
    requiredRoles: [Role.SystemAdvancedWrite],
    formValidators: [
      matchOthersFgValidator(
        'sed_passwd2',
        ['sed_passwd'],
        translate.instant('SED password and confirmation should match.'),
      ),
    ],
    fields: [
      {
        name: 'sed_passwd',
        type: 'input',
        inputType: 'password',
        label: helptextSystemAdvanced.sedPasswordLabel,
        tooltip: helptextSystemAdvanced.sedPasswordTooltip,
      },
      {
        name: 'sed_passwd2',
        type: 'input',
        inputType: 'password',
        label: helptextSystemAdvanced.sedConfirmPasswordLabel,
      },
    ],
    submit: (event) => {
      const values = { ...event.allValues } as Partial<SedFormValues>;
      delete values.sed_passwd2;

      return {
        request$: api.call('system.advanced.update', [values]),
        successMessage: translate.instant('Settings saved'),
        onSuccess: () => store$.dispatch(advancedConfigUpdated()),
      };
    },
  };
}

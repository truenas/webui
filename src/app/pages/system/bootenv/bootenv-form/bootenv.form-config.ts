import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { BootenvCloneParams } from 'app/interfaces/boot-environment.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface BootenvFormValues {
  source: string;
  target: string;
}

export function getBootenvFormConfig(
  api: ApiService,
  translate: TranslateService,
  currentName: string | undefined,
): FormDefinition<BootenvFormValues> {
  return {
    title: T('Clone Boot Environment'),
    requiredRoles: [Role.BootEnvWrite],
    sections: [{
      title: T('Settings'),
      fields: [
        {
          name: 'target',
          type: 'input',
          label: T('Name'),
          tooltip: helptextSystemBootenv.cloneNameTooltip,
          required: true,
          validators: [Validators.pattern(nameValidatorRegex)],
        },
        {
          name: 'source',
          type: 'input',
          label: T('Source'),
          tooltip: helptextSystemBootenv.cloneSourceTooltip,
          required: true,
          disabled: true,
          value: currentName,
        },
      ],
    }],
    submit: (event) => {
      const cloneParams: BootenvCloneParams = [{
        id: String(currentName),
        target: event.allValues.target,
      }];

      return {
        request$: api.call('boot.environment.clone', cloneParams),
        successMessage: translate.instant('Boot environment cloned'),
        closeWith: () => true,
      };
    },
  };
}

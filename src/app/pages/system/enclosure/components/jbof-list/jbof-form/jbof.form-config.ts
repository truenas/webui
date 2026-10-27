import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { Jbof } from 'app/interfaces/jbof.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ApiService } from 'app/modules/websocket/api.service';

export function getJbofFormConfig(
  api: ApiService,
  translate: TranslateService,
  editingJbof: Jbof | undefined,
): FormDefinition<Jbof> {
  return {
    addTitle: T('Add Expansion Shelf'),
    editTitle: T('Edit Expansion Shelf'),
    requiredRoles: [Role.JbofWrite],
    fields: [
      {
        name: 'description',
        type: 'input',
        label: T('Description'),
        required: true,
      },
      {
        name: 'mgmt_ip1',
        type: 'input',
        label: T('IP'),
        tooltip: T('IP of 1st Redfish management interface.'),
        required: true,
        validators: [ipv4Validator()],
      },
      {
        name: 'mgmt_ip2',
        type: 'input',
        label: T('Optional IP'),
        tooltip: T('Optional IP of 2nd Redfish management interface.'),
        validators: [ipv4Validator()],
      },
      {
        name: 'mgmt_username',
        type: 'input',
        label: T('Username'),
        tooltip: T('Redfish administrative username.'),
        required: true,
      },
      {
        name: 'mgmt_password',
        type: 'input',
        inputType: 'password',
        label: T('Password'),
        tooltip: T('Redfish administrative password.'),
        required: true,
      },
    ],
    submit: (event) => ({
      request$: editingJbof
        ? api.call('jbof.update', [editingJbof.id, event.allValues])
        : api.call('jbof.create', [event.allValues]),
      successMessage: editingJbof
        ? translate.instant('Expansion shelf updated')
        : translate.instant('Expansion shelf added'),
    }),
  };
}

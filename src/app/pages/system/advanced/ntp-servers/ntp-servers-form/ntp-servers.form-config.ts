import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemNtpservers as helptext } from 'app/helptext/system/ntp-servers';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { ApiService } from 'app/modules/websocket/api.service';

export function getNtpServersFormConfig(
  api: ApiService,
  translate: TranslateService,
  editingServer: NtpServer | undefined,
): FormDefinition<CreateNtpServer> {
  return {
    addTitle: T('Add NTP Server'),
    editTitle: T('Edit NTP Server'),
    requiredRoles: [Role.NetworkGeneralWrite],
    formValidators: [
      greaterThanFg(
        'maxpoll',
        ['minpoll'],
        translate.instant('Value must be greater than {label}', { label: helptext.minpoll.label }),
      ),
    ],
    sections: [{
      title: helptext.fieldset,
      fields: [
        {
          name: 'address', type: 'input', label: helptext.address.label, tooltip: helptext.address.tooltip, required: true,
        },
        {
          name: 'burst', type: 'checkbox', label: helptext.burst.label, tooltip: helptext.burst.tooltip,
        },
        {
          name: 'iburst', type: 'checkbox', label: helptext.iburst.label, tooltip: helptext.iburst.tooltip, value: true,
        },
        {
          name: 'prefer', type: 'checkbox', label: helptext.prefer.label, tooltip: helptext.prefer.tooltip,
        },
        {
          name: 'minpoll',
          type: 'input',
          inputType: 'number',
          label: helptext.minpoll.label,
          tooltip: helptext.minpoll.tooltip,
          required: true,
          value: 6,
          validators: [Validators.min(4)],
        },
        {
          name: 'maxpoll',
          type: 'input',
          inputType: 'number',
          label: helptext.maxpoll.label,
          tooltip: helptext.maxpoll.tooltip,
          required: true,
          value: 10,
          validators: [Validators.max(17)],
        },
        {
          name: 'force', type: 'checkbox', label: helptext.force.label, tooltip: helptext.force.tooltip,
        },
      ],
    }],
    submit: (event) => ({
      request$: editingServer
        ? api.call('system.ntpserver.update', [editingServer.id, event.allValues])
        : api.call('system.ntpserver.create', [event.allValues]),
      successMessage: editingServer
        ? translate.instant('NTP server updated')
        : translate.instant('NTP server added'),
    }),
  };
}

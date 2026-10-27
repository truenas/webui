import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemTunable as helptext } from 'app/helptext/system/tunable';
import { Choices } from 'app/interfaces/choices.interface';
import { Tunable, TunableCreateArgs } from 'app/interfaces/tunable.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export function getTunableFormConfig(
  api: ApiService,
  translate: TranslateService,
  editingTunable: Tunable | undefined,
): FormDefinition<Tunable> {
  return {
    title: editingTunable
      ? translate.instant(T('Edit Tunable ({type})'), { type: editingTunable.type?.toUpperCase() || '' })
      : undefined,
    addTitle: T('Add Tunable'),
    requiredRoles: [Role.SystemTunableWrite],
    fields: [
      {
        name: 'type',
        type: 'select',
        label: T('Type'),
        required: true,
        disabled: !!editingTunable,
        options: api.call('tunable.tunable_type_choices').pipe(
          // Middleware declares a fixed set of keys, which an interface without an index signature cannot be read as.
          map((choices): Choices => ({ ...choices })),
          choicesToOptions(),
        ),
      },
      {
        name: 'var',
        type: 'input',
        label: T('Variable'),
        tooltip: helptext.varTooltip,
        required: true,
        disabled: !!editingTunable,
      },
      {
        name: 'value',
        type: 'textarea',
        label: T('Value'),
        tooltip: helptext.valueTooltip,
        required: true,
      },
      {
        name: 'comment',
        type: 'input',
        label: T('Description'),
      },
      {
        name: 'enabled',
        type: 'checkbox',
        label: T('Enabled'),
        value: true,
      },
    ],
    submit: (event) => {
      const values = event.allValues;
      return {
        request$: editingTunable
          ? api.job('tunable.update', [
              editingTunable.id,
              {
                comment: values.comment,
                enabled: values.enabled,
                value: values.value,
              },
            ])
          : api.job('tunable.create', [{
              // The type select holds a value from `tunable.tunable_type_choices`.
              type: values.type as TunableCreateArgs['type'],
              var: values.var,
              value: values.value,
              comment: values.comment,
              enabled: values.enabled,
            }]),
        successMessage: editingTunable
          ? translate.instant('Tunable updated')
          : translate.instant('Tunable added'),
      };
    },
  };
}

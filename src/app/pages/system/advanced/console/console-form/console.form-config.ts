import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ConsoleConfig } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export function getConsoleFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
): FormDefinition<ConsoleConfig> {
  const serialPortOptions$ = api.call('system.advanced.serial_port_choices').pipe(choicesToOptions());
  const serialSpeedOptions$ = of([
    { label: '9600', value: '9600' },
    { label: '19200', value: '19200' },
    { label: '38400', value: '38400' },
    { label: '57600', value: '57600' },
    { label: '115200', value: '115200' },
  ]);

  return {
    title: T('Console'),
    requiredRoles: [Role.SystemAdvancedWrite],
    fields: [
      {
        name: 'consolemenu',
        type: 'checkbox',
        label: T('Show Text Console without Password Prompt'),
        tooltip: helptext.consoleMenuTooltip,
      },
      {
        name: 'serialconsole',
        type: 'checkbox',
        label: T('Enable Serial Console'),
        tooltip: helptext.serialConsoleTooltip,
      },
      {
        name: 'serialport',
        type: 'select',
        label: T('Serial Port'),
        tooltip: helptext.serialPortTooltip,
        options: serialPortOptions$,
        // Mirrors the former enabledWhile: only relevant with the serial console on.
        enabledWhen: (value) => value.serialconsole,
      },
      {
        name: 'serialspeed',
        type: 'select',
        label: T('Serial Speed'),
        tooltip: helptext.serialSpeedTooltip,
        options: serialSpeedOptions$,
        enabledWhen: (value) => value.serialconsole,
      },
      {
        name: 'motd',
        type: 'textarea',
        label: T('MOTD Banner'),
        tooltip: helptext.motdTooltip,
      },
    ],
    submit: (event) => {
      // getRawValue() keeps disabled controls, so drop the serial fields when the
      // serial console is off — matching the original form.value payload.
      const payload: Partial<ConsoleConfig> = { ...event.allValues };
      if (!payload.serialconsole) {
        delete payload.serialport;
        delete payload.serialspeed;
      }

      return {
        request$: api.call('system.advanced.update', [payload]),
        successMessage: translate.instant('Settings saved'),
        onSuccess: () => store$.dispatch(advancedConfigUpdated()),
      };
    },
  };
}

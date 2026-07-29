import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ConsoleConfig } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { getConsoleFormConfig } from 'app/pages/system/advanced/console/console-form/console.form-config';
import { AppState } from 'app/store';

describe('getConsoleFormConfig', () => {
  const api = { call: jest.fn(() => of([])) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store<AppState>;

  beforeEach(() => jest.clearAllMocks());

  it('builds an update request with the full config when the serial console is on', () => {
    const allValues = {
      consolemenu: true,
      serialconsole: true,
      serialport: 'ttyS0',
      serialspeed: '9600',
      motd: 'Welcome back',
    } as ConsoleConfig;

    const definition = getConsoleFormConfig(api, translate, store$);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<ConsoleConfig>);

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [allValues]);
  });

  it('drops the serial fields from the update payload when the serial console is off', () => {
    const allValues = {
      consolemenu: true,
      serialconsole: false,
      serialport: 'ttyS0',
      serialspeed: '9600',
      motd: 'Welcome back',
    } as ConsoleConfig;

    const definition = getConsoleFormConfig(api, translate, store$);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<ConsoleConfig>);

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{
      consolemenu: true,
      serialconsole: false,
      motd: 'Welcome back',
    }]);
  });
});

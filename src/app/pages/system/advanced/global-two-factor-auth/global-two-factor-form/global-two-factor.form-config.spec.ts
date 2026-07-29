import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getGlobalTwoFactorFormConfig,
  GlobalTwoFactorFormValues,
} from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor.form-config';

describe('getGlobalTwoFactorFormConfig', () => {
  const allValues = { enabled: true, window: 5, ssh: true } as GlobalTwoFactorFormValues;

  const api = { call: jest.fn(() => of(undefined)) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const dialogService = { confirm: jest.fn(() => of(true)) } as unknown as DialogService;
  const authService = { globalTwoFactorConfigUpdated: jest.fn() } as unknown as AuthService;
  const router = { navigate: jest.fn() } as unknown as Router;
  const window = { localStorage: { setItem: jest.fn() } } as unknown as Window;
  const twoFactorConfig = { enabled: false, window: 0, services: { ssh: false } } as GlobalTwoFactorConfig;

  beforeEach(() => jest.clearAllMocks());

  it('builds an update request with the mapped two-factor payload', () => {
    const definition = getGlobalTwoFactorFormConfig(
      api,
      translate,
      dialogService,
      authService,
      router,
      window,
      twoFactorConfig,
    );

    const result = definition.submit({
      isEdit: true,
      allValues,
      changedValues: allValues,
    } as FormSubmitEvent<GlobalTwoFactorFormValues>);

    result.request$.subscribe();

    expect(api.call).toHaveBeenCalledWith('auth.twofactor.update', [{
      enabled: true,
      services: { ssh: true },
      window: 5,
    }]);
  });
});

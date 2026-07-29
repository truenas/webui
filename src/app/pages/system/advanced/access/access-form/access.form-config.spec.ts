import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getAccessFormConfig, AccessFormValues } from 'app/pages/system/advanced/access/access-form/access.form-config';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';

describe('getAccessFormConfig', () => {
  const allValues = { ds_auth: false, login_banner: 'Welcome' } as AccessFormValues;

  const api = { call: jest.fn(() => of(undefined)) } as unknown as ApiService;
  const store$ = { dispatch: jest.fn(), pipe: jest.fn() } as unknown as Store;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('updates the login banner when it changed', () => {
    const definition = getAccessFormConfig(api, translate, store$, () => false);
    definition.submit({
      isEdit: true,
      allValues,
      changedValues: { login_banner: 'Welcome' },
    } as FormSubmitEvent<AccessFormValues>);

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ login_banner: 'Welcome' }]);
    expect(api.call).not.toHaveBeenCalledWith('system.general.update', expect.anything());
  });

  it('updates ds_auth on enterprise systems', () => {
    const definition = getAccessFormConfig(api, translate, store$, () => true);
    definition.submit({
      isEdit: true,
      allValues,
      changedValues: {},
    } as FormSubmitEvent<AccessFormValues>);

    expect(api.call).toHaveBeenCalledWith('system.general.update', [{ ds_auth: false }]);
    expect(api.call).not.toHaveBeenCalledWith('system.advanced.update', expect.anything());
  });

  it('dispatches config-updated actions after a banner change', () => {
    const definition = getAccessFormConfig(api, translate, store$, () => false);
    const { request$ } = definition.submit({
      isEdit: true,
      allValues,
      changedValues: { login_banner: 'Welcome' },
    } as FormSubmitEvent<AccessFormValues>);
    request$.subscribe();

    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
    expect(store$.dispatch).toHaveBeenCalledWith(loginBannerUpdated({ loginBanner: 'Welcome' }));
  });

  it('dispatches generalConfigUpdated on enterprise systems', () => {
    const definition = getAccessFormConfig(api, translate, store$, () => true);
    const { request$ } = definition.submit({
      isEdit: true,
      allValues,
      changedValues: {},
    } as FormSubmitEvent<AccessFormValues>);
    request$.subscribe();

    expect(store$.dispatch).toHaveBeenCalledWith(generalConfigUpdated());
  });
});

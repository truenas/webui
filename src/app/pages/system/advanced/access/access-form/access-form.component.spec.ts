import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';
import { selectAdvancedConfig, selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('AccessFormComponent', () => {
  let spectator: Spectator<AccessFormComponent>;
  let loader: HarnessLoader;
  const slideInRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    getData: jest.fn((): undefined => undefined),
    requireConfirmationWhen: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: AccessFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockWindow({
        localStorage: {
          setItem: jest.fn,
        },
        sessionStorage: {
          setItem: jest.fn,
        },
      }),
      mockApi([
        mockCall('system.general.update'),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SystemGeneralService),
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: null,
            productType: ProductType.Enterprise,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
        selectors: [{
          selector: selectGeneralConfig,
          value: { ds_auth: true },
        }, {
          selector: selectAdvancedConfig,
          value: { login_banner: 'test' },
        }],
      }),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows settings values when form is being edited', async () => {
    const loginBanner = await loader.getHarness(TnInputHarness.with({ name: 'login_banner' }));
    const dsAuth = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Allow Directory Service users to access WebUI' }),
    );

    expect(await loginBanner.getValue()).toBe('test');
    expect(await dsAuth.isChecked()).toBe(true);
  });

  it('updates settings when save is pressed', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    // Clear the textarea natively: CDK's setValue('') throws on an empty string.
    const bannerEl = spectator.query<HTMLTextAreaElement>('textarea[name="login_banner"]')
      ?? spectator.query<HTMLInputElement>('input[name="login_banner"]');
    bannerEl!.value = '';
    bannerEl!.dispatchEvent(new Event('input'));
    bannerEl!.dispatchEvent(new Event('blur'));
    spectator.detectChanges();

    const dsAuth = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Allow Directory Service users to access WebUI' }),
    );
    await dsAuth.uncheck();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.general.update', [{
      ds_auth: false,
    }]);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.update', [{
      login_banner: '',
    }]);
    expect(store$.dispatch).toHaveBeenCalledWith(generalConfigUpdated());
    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
    expect(store$.dispatch).toHaveBeenCalledWith(loginBannerUpdated({ loginBanner: '' }));
    expect(slideInRef.close).toHaveBeenCalled();
  });
});

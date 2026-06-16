import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';

describe('SedFormComponent', () => {
  let spectator: Spectator<SelfEncryptingDriveFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: SelfEncryptingDriveFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('system.advanced.update'),
        mockCall('system.advanced.sed_global_password', '***'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({ sedPassword: '***' })),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows current system advanced sed values when form is being edited without *** content', async () => {
    const password = await loader.getHarness(TnInputHarness.with({ name: 'sed_passwd' }));
    const confirmPassword = await loader.getHarness(TnInputHarness.with({ name: 'sed_passwd2' }));

    expect(await password.getValue()).toBe('');
    expect(await confirmPassword.getValue()).toBe('');
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const password = await loader.getHarness(TnInputHarness.with({ name: 'sed_passwd' }));
    const confirmPassword = await loader.getHarness(TnInputHarness.with({ name: 'sed_passwd2' }));
    await password.setValue('pleasechange');
    await confirmPassword.setValue('pleasechange');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [
      {
        sed_passwd: 'pleasechange',
      },
    ]);
  });
});

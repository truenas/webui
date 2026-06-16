// cspell:ignore ngneat ntpserver iburst minpoll maxpoll
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NtpServersFormComponent } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers-form.component';

describe('NtpServerFormComponent', () => {
  let spectator: Spectator<NtpServersFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const setInput = async (name: string, value: string): Promise<void> => {
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    await input.setValue(value);
  };

  const checkboxByLabel = (label: string): Promise<TnCheckboxHarness> => {
    return loader.getHarness(TnCheckboxHarness.with({ label }));
  };

  const editingNtpServer = {
    id: 1,
    address: 'mock.ntp.server',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  } as NtpServer;

  const slideInRef: SlideInRef<NtpServer | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: NtpServersFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('system.ntpserver.create'),
        mockCall('system.ntpserver.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding ntp server', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      await setInput('address', 'ua.pool.ntp.org');
      await setInput('minpoll', '8');
      await (await checkboxByLabel('Force')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.ntpserver.create', [{
        address: 'ua.pool.ntp.org',
        burst: false,
        iburst: true,
        prefer: false,
        minpoll: 8,
        maxpoll: 10,
        force: true,
      }]);
    });
  });

  describe('editing ntp server', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => editingNtpServer }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current server values when form is being edited', async () => {
      const address = await loader.getHarness(TnInputHarness.with({ name: 'address' }));
      const minpoll = await loader.getHarness(TnInputHarness.with({ name: 'minpoll' }));
      const maxpoll = await loader.getHarness(TnInputHarness.with({ name: 'maxpoll' }));

      expect(await address.getValue()).toBe('mock.ntp.server');
      expect(await minpoll.getNumericValue()).toBe(6);
      expect(await maxpoll.getNumericValue()).toBe(10);
      expect(await (await checkboxByLabel('Burst')).isChecked()).toBe(false);
      expect(await (await checkboxByLabel('IBurst')).isChecked()).toBe(true);
      expect(await (await checkboxByLabel('Prefer')).isChecked()).toBe(false);
      expect(await (await checkboxByLabel('Force')).isChecked()).toBe(false);
    });

    it('sends the full payload on update when save is pressed', async () => {
      await setInput('address', 'updated.mock.ntp.server');
      await setInput('maxpoll', '14');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.ntpserver.update', [
        1,
        {
          address: 'updated.mock.ntp.server',
          burst: false,
          iburst: true,
          prefer: false,
          minpoll: 6,
          maxpoll: 14,
          force: false,
        },
      ]);
    });
  });
});

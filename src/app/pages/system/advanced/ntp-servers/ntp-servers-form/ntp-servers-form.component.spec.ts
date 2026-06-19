import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NtpServersFormComponent } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers-form.component';

describe('NtpServersFormComponent', () => {
  let spectator: Spectator<NtpServersFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: NtpServersFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogService),
      mockApi([
        mockCall('system.ntpserver.create'),
        mockCall('system.ntpserver.update'),
      ]),
      mockProvider(SlideIn),
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
      await (await getInput('address')).setValue('ua.pool.ntp.org');
      await (await getInput('minpoll')).setValue('8');
      await (await getCheckbox('force')).check();

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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
      expect(await (await getInput('address')).getValue()).toBe('mock.ntp.server');
      expect(await (await getCheckbox('burst')).isChecked()).toBe(false);
      expect(await (await getCheckbox('iburst')).isChecked()).toBe(true);
      expect(await (await getCheckbox('prefer')).isChecked()).toBe(false);
      expect(await (await getInput('minpoll')).getValue()).toBe('6');
      expect(await (await getInput('maxpoll')).getValue()).toBe('10');
      expect(await (await getCheckbox('force')).isChecked()).toBe(false);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      await (await getInput('address')).setValue('updated.mock.ntp.server');
      await (await getInput('maxpoll')).setValue('14');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NtpServerFormComponent } from './ntp-server-form.component';

describe('NtpServerFormComponent', () => {
  let spectator: Spectator<NtpServerFormComponent>;
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
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: NtpServerFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogService),
      mockApi([
        mockCall('system.ntpserver.create'),
        mockCall('system.ntpserver.update'),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
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
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Address: 'ua.pool.ntp.org',
        'Min Poll': 8,
        Force: true,
      });

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
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Address: 'mock.ntp.server',
        Burst: false,
        IBurst: true,
        Prefer: false,
        'Min Poll': '6',
        'Max Poll': '10',
        Force: false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Address: 'updated.mock.ntp.server',
        'Max Poll': 14,
      });

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

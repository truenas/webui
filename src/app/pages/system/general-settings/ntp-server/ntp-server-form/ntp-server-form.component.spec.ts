import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { NtpServerFormComponent } from './ntp-server-form.component';

describe('NtpServerFormComponent', () => {
  let spectator: Spectator<NtpServerFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: NtpServerFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogService),
      mockWebSocket([
        mockCall('system.ntpserver.create'),
        mockCall('system.ntpserver.update'),
      ]),
      mockProvider(SlideInService),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  describe('adding ntp server', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Address: 'ua.pool.ntp.org',
        Force: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('system.ntpserver.create', [{
        address: 'ua.pool.ntp.org',
        burst: false,
        iburst: true,
        prefer: false,
        minpoll: 6,
        maxpoll: 10,
        force: true,
      }]);
    });
  });

  describe('editing ntp server', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              id: 1,
              address: 'mock.ntp.server',
              burst: false,
              iburst: true,
              prefer: false,
              minpoll: 6,
              maxpoll: 10,
            } as NtpServer,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('system.ntpserver.update', [
        1,
        {
          address: 'updated.mock.ntp.server',
          burst: false,
          iburst: true,
          prefer: false,
          minpoll: 6,
          maxpoll: 10,
          force: false,
        },
      ]);
    });
  });
});

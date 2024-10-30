import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Jbof } from 'app/interfaces/jbof.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('JbofFormComponent', () => {
  let spectator: Spectator<JbofFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: JbofFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('jbof.create'),
        mockCall('jbof.update'),
      ]),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding a new jbof', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('sends a create payload to websocket and closes modal form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'new description',
        IP: '11.11.11.11',
        'Optional IP': '12.12.12.12',
        Username: 'admin',
        Password: 'qwerty',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('jbof.create', [{
        description: 'new description',
        mgmt_ip1: '11.11.11.11',
        mgmt_ip2: '12.12.12.12',
        mgmt_username: 'admin',
        mgmt_password: 'qwerty',
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('editing a jbof', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              id: 131,
              description: 'editing description',
              mgmt_ip1: '13.13.13.13',
              mgmt_ip2: '14.14.14.14',
              mgmt_username: 'user',
              mgmt_password: '12345678',
            } as Jbof,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Description: 'editing description',
        IP: '13.13.13.13',
        'Optional IP': '14.14.14.14',
        Username: 'user',
        Password: '12345678',
      });
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'updated description',
        IP: '15.15.15.15',
        'Optional IP': '',
        Username: 'admin',
        Password: 'qwerty',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('jbof.update', [
        131,
        {
          description: 'updated description',
          mgmt_ip1: '15.15.15.15',
          mgmt_ip2: '',
          mgmt_username: 'admin',
          mgmt_password: 'qwerty',
        },
      ]);
    });
  });
});

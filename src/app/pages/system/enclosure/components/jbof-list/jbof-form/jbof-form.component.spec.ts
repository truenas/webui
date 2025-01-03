import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Jbof } from 'app/interfaces/jbof.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';

describe('JbofFormComponent', () => {
  let spectator: Spectator<JbofFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const existingJbof = {
    id: 131,
    description: 'editing description',
    mgmt_ip1: '13.13.13.13',
    mgmt_ip2: '14.14.14.14',
    mgmt_username: 'user',
    mgmt_password: '12345678',
  } as Jbof;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: JbofFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('jbof.create'),
        mockCall('jbof.update'),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding a new jbof', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
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

      expect(api.call).toHaveBeenCalledWith('jbof.create', [{
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
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingJbof }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
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

      expect(api.call).toHaveBeenCalledWith('jbof.update', [
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

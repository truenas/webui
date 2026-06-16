import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Jbof } from 'app/interfaces/jbof.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
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

  const slideInRef: SlideInRef<Jbof | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const setInput = async (name: string, value: string): Promise<void> => {
    if (value === '') {
      const inputEl = spectator.query<HTMLInputElement>(`input[name="${name}"]`);
      if (inputEl) {
        spectator.typeInElement('', inputEl);
        inputEl.value = '';
        inputEl.dispatchEvent(new Event('input'));
      }
      return;
    }
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    await input.setValue(value);
  };

  const createComponent = createComponentFactory({
    component: JbofFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('jbof.create'),
        mockCall('jbof.update'),
      ]),
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
      await setInput('description', 'new description');
      await setInput('mgmt_ip1', '11.11.11.11');
      await setInput('mgmt_ip2', '12.12.12.12');
      await setInput('mgmt_username', 'admin');
      await setInput('mgmt_password', 'qwerty');

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
      const description = await loader.getHarness(TnInputHarness.with({ name: 'description' }));
      const mgmtIp1 = await loader.getHarness(TnInputHarness.with({ name: 'mgmt_ip1' }));
      const mgmtIp2 = await loader.getHarness(TnInputHarness.with({ name: 'mgmt_ip2' }));
      const mgmtUsername = await loader.getHarness(TnInputHarness.with({ name: 'mgmt_username' }));
      const mgmtPassword = await loader.getHarness(TnInputHarness.with({ name: 'mgmt_password' }));

      expect(await description.getValue()).toBe('editing description');
      expect(await mgmtIp1.getValue()).toBe('13.13.13.13');
      expect(await mgmtIp2.getValue()).toBe('14.14.14.14');
      expect(await mgmtUsername.getValue()).toBe('user');
      expect(await mgmtPassword.getValue()).toBe('12345678');
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      await setInput('description', 'updated description');
      await setInput('mgmt_ip1', '15.15.15.15');
      await setInput('mgmt_ip2', '');
      await setInput('mgmt_username', 'admin');
      await setInput('mgmt_password', 'qwerty');

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

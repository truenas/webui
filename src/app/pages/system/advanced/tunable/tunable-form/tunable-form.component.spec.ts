import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Tunable } from 'app/interfaces/tunable.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { TunableFormComponent } from 'app/pages/system/advanced/tunable/tunable-form/tunable-form.component';

describe('TunableFormComponent', () => {
  let spectator: Spectator<TunableFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<Tunable | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const setInput = async (name: string, value: string): Promise<void> => {
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    await input.setValue(value);
  };

  const createComponent = createComponentFactory({
    component: TunableFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockJob('tunable.create', fakeSuccessfulJob()),
        mockJob('tunable.update', fakeSuccessfulJob()),
        mockCall('tunable.tunable_type_choices', {
          SYSCTL: 'SYSCTL',
          UDEV: 'UDEV',
        }),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding a new sysctl variable', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends a create payload to websocket and closes modal form is saved', async () => {
      await (await loader.getHarness(TnSelectHarness)).selectOption('UDEV');
      await setInput('var', 'some.var');
      await setInput('value', '42');
      await setInput('comment', 'Answer to the question');
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.job).toHaveBeenCalledWith('tunable.create', [{
        comment: 'Answer to the question',
        enabled: true,
        type: 'UDEV',
        value: '42',
        var: 'some.var',
      }]);
    });
  });

  describe('editing a sysctl variable', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              id: 1,
              comment: 'Existing variable',
              type: 'SYSCTL',
              enabled: false,
              var: 'var.exist',
              value: 'Existing value',
            } as Tunable),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current group values when form is being edited', async () => {
      const type = await loader.getHarness(TnSelectHarness);
      const variable = await loader.getHarness(TnInputHarness.with({ name: 'var' }));
      const value = await loader.getHarness(TnInputHarness.with({ name: 'value' }));
      const comment = await loader.getHarness(TnInputHarness.with({ name: 'comment' }));
      const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));

      expect(await type.getDisplayText()).toBe('SYSCTL');
      expect(await variable.getValue()).toBe('var.exist');
      expect(await value.getValue()).toBe('Existing value');
      expect(await comment.getValue()).toBe('Existing variable');
      expect(await enabled.isChecked()).toBe(false);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).check();
      await setInput('value', 'New value');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.job).toHaveBeenCalledWith('tunable.update', [
        1,
        {
          comment: 'Existing variable',
          enabled: true,
          value: 'New value',
        },
      ]);
    });
  });
});

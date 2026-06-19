import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Tunable } from 'app/interfaces/tunable.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { TunableFormComponent } from 'app/pages/system/advanced/tunable/tunable-form/tunable-form.component';

describe('TunableFormComponent', () => {
  let spectator: Spectator<TunableFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const createComponent = createComponentFactory({
    component: TunableFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockJob('tunable.create', fakeSuccessfulJob()),
        mockJob('tunable.update', fakeSuccessfulJob()),
        mockCall('tunable.tunable_type_choices', {
          SYSCTL: 'SYSCTL',
          UDEV: 'UDEV',
        }),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn((): undefined => undefined),
        requireConfirmationWhen: jest.fn(),
      }),
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
      const typeSelect = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="type"]' }));
      await typeSelect.selectOption('UDEV');

      const varInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="var"]' }));
      await varInput.setValue('some.var');

      const valueInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="value"]' }));
      await valueInput.setValue('42');

      const commentInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="comment"]' }));
      await commentInput.setValue('Answer to the question');

      const enabledCheckbox = await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="enabled"]' }));
      await enabledCheckbox.check();

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
            getData: jest.fn(() => ({
              id: 1,
              comment: 'Existing variable',
              type: 'SYSCTL',
              enabled: false,
              var: 'var.exist',
              value: 'Existing value',
            } as Tunable)),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current group values when form is being edited', async () => {
      const varInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="var"]' }));
      const valueInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="value"]' }));
      const commentInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="comment"]' }));
      const enabledCheckbox = await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="enabled"]' }));

      expect(await varInput.getValue()).toBe('var.exist');
      expect(await valueInput.getValue()).toBe('Existing value');
      expect(await commentInput.getValue()).toBe('Existing variable');
      expect(await enabledCheckbox.isChecked()).toBe(false);
      expect(spectator.component.form.controls.type.value).toBe('SYSCTL');
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const enabledCheckbox = await loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="enabled"]' }));
      await enabledCheckbox.check();

      const valueInput = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="value"]' }));
      await valueInput.setValue('New value');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

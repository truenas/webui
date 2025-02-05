import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Tunable } from 'app/interfaces/tunable.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';

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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => undefined),
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
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'UDEV',
        Variable: 'some.var',
        Value: '42',
        Description: 'Answer to the question',
        Enabled: true,
      });

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
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Type: 'SYSCTL',
        Variable: 'var.exist',
        Description: 'Existing variable',
        Value: 'Existing value',
        Enabled: false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Enabled: true,
        Value: 'New value',
      });

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

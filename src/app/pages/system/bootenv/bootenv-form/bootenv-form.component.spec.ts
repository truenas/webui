import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';

describe('BootEnvironmentFormComponent', () => {
  let spectator: Spectator<BootEnvironmentFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<string | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: BootEnvironmentFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('boot.environment.clone'),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef),
      mockAuth(),
    ],
  });

  /*

  * Clone
  */
  describe('cloning a boot environment', () => {
    const cloneSource = 'original';

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => cloneSource }),
        ],
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should add source field to DOM', () => {
      const sourceFieldElement = IxInputHarness.with({ label: 'Source' });
      expect(sourceFieldElement).toBeTruthy();
    });

    it('sends a create payload with source option to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const fields = {
        id: cloneSource,
        target: 'cloned',
      };

      await form.fillForm({
        Name: fields.target,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('boot.environment.clone', [
        fields,
      ]);
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ContainerConfig } from 'app/interfaces/container-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ContainerSettingsComponent } from 'app/pages/apps/components/installed-apps/container-settings/container-settings.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

describe('KubernetesSettingsComponent', () => {
  let spectator: Spectator<ContainerSettingsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ContainerSettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getContainerConfig: jest.fn(() => of({
          enable_image_updates: true,
        } as ContainerConfig)),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current config and shows values in the form', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(spectator.inject(ApplicationsService).getContainerConfig).toHaveBeenCalled();
    expect(values).toEqual({
      'Enable Container Image Updates': true,
    });
  });

  it('saves updated config without warning when basic settings are updated', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Enable Container Image Updates': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
    expect(spectator.inject(ApplicationsService).updateContainerConfig).toHaveBeenCalledWith(false);
  });
});

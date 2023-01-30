import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TokenSettingsComponent } from 'app/pages/system/advanced/token-settings/token-settings.component';
import { SystemGeneralService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('TokenSettingsComponent', () => {
  let spectator: Spectator<TokenSettingsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TokenSettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWindow({
        localStorage: {
          getItem: () => '300',
          setItem: jest.fn,
        },
      }),
      mockProvider(IxSlideInService),
      mockProvider(SystemGeneralService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current lifetime values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Token Lifetime': '300',
    });
  });

  it('updates lifetime when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Token Lifetime': '60',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});

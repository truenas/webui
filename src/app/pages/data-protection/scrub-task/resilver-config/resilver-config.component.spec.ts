import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ResilverConfigComponent } from './resilver-config.component';

describe('ResilverConfigComponent', () => {
  let spectator: Spectator<ResilverConfigComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const createComponent = createComponentFactory({
    component: ResilverConfigComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.resilver.config', {
          enabled: true,
          begin: '08:00',
          end: '10:00',
          weekday: [1, 3, 5],
        } as ResilverConfig),
        mockCall('pool.resilver.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(Router),
      mockProvider(LanguageService),
      mockProvider(LocaleService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads and shows current resilver settings when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      Enabled: true,
      Begin: '08:00:00',
      End: '10:00:00',
      'Days of the Week': ['Monday', 'Wednesday', 'Friday'],
    });
  });

  it('saves resilver config and redirects to data protection when saved is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Enabled: false,
      Begin: '09:00:00',
      End: '11:15:00',
      'Days of the Week': ['Monday', 'Tuesday'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith(
      'pool.resilver.update',
      [{
        enabled: false,
        begin: '09:00',
        end: '11:15',
        weekday: [1, 2],
      }],
    );
  });
});

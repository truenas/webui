import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('LocalizationFormComponent', () => {
  let spectator: Spectator<LocalizationFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const settings = {
    kbdMap: 'us',
    timezone: 'America/Los_Angeles',
  } as LocalizationSettings;

  const slideInRef: SlideInRef<LocalizationSettings | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => settings),
  };

  const createComponent = createComponentFactory({
    component: LocalizationFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.general.update'),
      ]),
      mockProvider(SystemGeneralService, {
        kbdMapChoices(): Observable<Option[]> {
          return of([
            { value: 'ua.winkeys', label: 'Ukrainian (Win keys) (ua.winkeys)' },
            { value: 'us', label: 'English (US) (us)' },
            { value: 'us.alt-intl', label: 'English (US, alt. intl.) (us.alt-intl)' },
          ]);
        },
        timezoneChoices(): Observable<Option[]> {
          return of([
            { label: 'America/Lima', value: 'America/Lima' },
            { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
            { label: 'America/Maceio', value: 'America/Maceio' },
          ]);
        },
      }),
      mockProvider(SlideIn),
      mockProvider(FormErrorHandlerService),
      provideMockStore(),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows current localization settings when editing', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Console Keyboard Map': 'English (US) (us)',
      Timezone: 'America/Los_Angeles',
    });
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Console Keyboard Map': 'English (US) (us)',
      Timezone: 'America/Los_Angeles',
    });
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.general.update', [{
      kbdmap: 'us',
      timezone: 'America/Los_Angeles',
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });
});

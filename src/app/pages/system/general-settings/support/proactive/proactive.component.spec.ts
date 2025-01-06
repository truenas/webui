import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SupportConfig } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';

describe('ProactiveComponent', () => {
  let spectator: Spectator<ProactiveComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let form: IxFormHarness;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: ProactiveComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('support.update'),
        mockCall('support.config', {
          enabled: true,
          name: 'Zepp Karlsen',
          title: 'Cannot connect',
          email: 'test-user@test-user.com',
          phone: '+888888888',
          secondary_name: 'Zepp Karlsen',
          secondary_title: 'Cannot connect',
          secondary_email: 'test-user@test-user.com',
          secondary_phone: '+999999999',
        } as SupportConfig),
        mockCall('support.is_available', true),
        mockCall('support.is_available_and_enabled', true),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads current proactive settings and shows them in the form', async () => {
    expect(api.call).toHaveBeenCalledWith('support.config');
    const value = await form.getValues();
    expect(value).toEqual({
      Name: 'Zepp Karlsen',
      Email: 'test-user@test-user.com',
      Title: 'Cannot connect',
      'Enable iXsystems Proactive Support': true,
      'Phone Number': '+888888888',
      'Secondary Email': 'test-user@test-user.com',
      'Secondary Name': 'Zepp Karlsen',
      'Secondary Phone Number': '+999999999',
      'Secondary Title': 'Cannot connect',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBeFalsy();
  });

  it('saves support config when form is submitted', async () => {
    const sendValue = {
      Name: 'Jhon Smith',
      'Phone Number': '+777-77-77-77',
    };
    await form.fillForm(sendValue);
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    expect(api.call).toHaveBeenCalledWith('support.update', [{
      enabled: true,
      name: 'Jhon Smith',
      title: 'Cannot connect',
      email: 'test-user@test-user.com',
      phone: '+777-77-77-77',
      secondary_name: 'Zepp Karlsen',
      secondary_title: 'Cannot connect',
      secondary_email: 'test-user@test-user.com',
      secondary_phone: '+999999999',
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('shows a warning when support is not available', async () => {
    spectator.inject(MockApiService).mockCall('support.is_available', false);
    spectator.component.ngOnInit();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

    expect(spectator.inject(DialogService).warn).toHaveBeenCalled();
    expect(saveButton.isDisabled()).toBeTruthy();
  });
});

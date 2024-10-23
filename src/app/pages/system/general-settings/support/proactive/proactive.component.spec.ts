import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SupportConfig } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import { ApiService } from 'app/services/api.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ProactiveComponent', () => {
  let spectator: Spectator<ProactiveComponent>;
  let loader: HarnessLoader;
  let ws: ApiService;
  let form: IxFormHarness;

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
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(ApiService);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads current proactive settings and shows them in the form', async () => {
    expect(ws.call).toHaveBeenCalledWith('support.config');
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
    expect(ws.call).toHaveBeenCalledWith('support.update', [{
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
    expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
  });

  it('shows a warning when support is not available', async () => {
    spectator.inject(MockApiService).mockCall('support.is_available', false);
    spectator.component.ngOnInit();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

    expect(spectator.inject(DialogService).warn).toHaveBeenCalled();
    expect(saveButton.isDisabled()).toBeTruthy();
  });
});

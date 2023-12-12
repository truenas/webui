import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SupportConfig } from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ProactiveComponent } from 'app/pages/system/general-settings/support/proactive/proactive.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ProactiveComponent', () => {
  let spectator: Spectator<ProactiveComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: ProactiveComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
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
    ws = spectator.inject(WebSocketService);
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
    spectator.inject(MockWebsocketService).mockCall('support.is_available', false);
    spectator.component.ngOnInit();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

    expect(spectator.inject(DialogService).warn).toHaveBeenCalled();
    expect(saveButton.isDisabled()).toBeTruthy();
  });
});

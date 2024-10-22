import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { KerberosConfig } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { WebSocketService } from 'app/services/api.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('KerberosSettingsComponent', () => {
  let spectator: Spectator<KerberosSettingsComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: KerberosSettingsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('kerberos.config', {
          appdefaults_aux: 'testparam',
          libdefaults_aux: 'clockskew=2',
        } as KerberosConfig),
        mockCall('kerberos.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(IxSlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads current kerberos settings and show them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('kerberos.config');
    expect(values).toEqual({
      'Appdefaults Auxiliary Parameters': 'testparam',
      'Libdefaults Auxiliary Parameters': 'clockskew=2',
    });
  });

  it('sends an update payload to websocket when settings are updated and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Appdefaults Auxiliary Parameters': 'newparam',
      'Libdefaults Auxiliary Parameters': 'clockskew=6',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('kerberos.update', [{
      appdefaults_aux: 'newparam',
      libdefaults_aux: 'clockskew=6',
    }]);
  });
});

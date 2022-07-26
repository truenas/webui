import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  IpmiIdentifyDialogComponent,
} from 'app/pages/network/components/ipmi-identify-dialog/ipmi-identify-dialog.component';
import { DialogService, WebSocketService } from 'app/services';

describe('IpmiIdentifyDialogComponent', () => {
  let spectator: Spectator<IpmiIdentifyDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: IpmiIdentifyDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('ipmi.identify'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('flashes IPMI light with specified duration when form is submitted', async () => {
    await form.fillForm({
      'IPMI Flash Duration': '3 minute',
    });

    const okButton = await loader.getHarness(MatButtonHarness.with({ text: 'OK' }));
    await okButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('ipmi.identify', [{ seconds: 180 }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('flashes with force flag when duration is set to Indefinitely', async () => {
    await form.fillForm({
      'IPMI Flash Duration': 'Indefinitely',
    });

    const okButton = await loader.getHarness(MatButtonHarness.with({ text: 'OK' }));
    await okButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('ipmi.identify', [{ force: true }]);
  });
});

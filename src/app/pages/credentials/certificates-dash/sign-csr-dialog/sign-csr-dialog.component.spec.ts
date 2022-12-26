import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { SignCsrDialogComponent } from './sign-csr-dialog.component';

describe('SignCsrDialogComponent', () => {
  let spectator: Spectator<SignCsrDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SignCsrDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('certificateauthority.ca_sign_csr'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(SystemGeneralService, {
        getUnsignedCertificates: () => of([
          { id: 1, name: 'csr-1' },
          { id: 2, name: 'csr-2' },
        ]),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: 13,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows CSRs in a select', async () => {
    const csrSelect = await loader.getHarness(IxSelectHarness.with({ label: 'CSRs' }));
    const optionLabels = await csrSelect.getOptionLabels();
    expect(optionLabels).toEqual(['csr-1', 'csr-2']);
  });

  it('signs a csr request when dialog is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      CSRs: 'csr-1',
      Identifier: 'new-cert',
    });

    const signButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sign' }));
    await signButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'certificateauthority.ca_sign_csr', [{
        ca_id: 13,
        csr_cert_id: 1,
        name: 'new-cert',
      }],
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});

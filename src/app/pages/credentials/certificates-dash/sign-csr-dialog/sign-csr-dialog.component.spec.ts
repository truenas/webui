import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { SignCsrDialogComponent } from './sign-csr-dialog.component';

describe('SignCsrDialogComponent', () => {
  let spectator: Spectator<SignCsrDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SignCsrDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('certificateauthority.ca_sign_csr'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
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
      mockAuth(),
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'certificateauthority.ca_sign_csr',
      [{
        ca_id: 13,
        csr_cert_id: 1,
        name: 'new-cert',
      }],
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});

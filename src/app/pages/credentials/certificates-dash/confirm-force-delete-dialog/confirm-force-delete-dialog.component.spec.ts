import { Certificate } from 'crypto';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ConfirmForceDeleteCertificateComponent } from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import { DialogService } from 'app/services/dialog.service';

describe('ConfirmForceDeleteCertificateComponent', () => {
  let spectator: Spectator<ConfirmForceDeleteCertificateComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ConfirmForceDeleteCertificateComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 'cert1',
          name: 'Cert Name',
        } as Partial<Certificate>,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('closes dialog with false when user presses Cancel', async () => {
    const cancelBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await cancelBtn.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });

  it('closes dialog with { force: false } when user presses Delete', async () => {
    const deleteBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteBtn.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ force: false });
  });

  it('closes dialog with { force: true } when user presses Delete with Force ticked', async () => {
    const forceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Force' }));
    await forceCheckbox.setValue(true);

    const deleteBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteBtn.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ force: true });
  });
});

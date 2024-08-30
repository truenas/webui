import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import {
  SetProductionStatusDialogComponent,
} from 'app/pages/system/general-settings/support/set-production-status-dialog/set-production-status-dialog.component';

describe('SetProductionStatusDialogComponent', () => {
  let spectator: Spectator<SetProductionStatusDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SetProductionStatusDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('closes dialog with value of Send Initial Debug checkbox when dialog is submitted', async () => {
    const sendInitialDebugCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Send initial debug' }));
    await sendInitialDebugCheckbox.setValue(true);

    const proceedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Proceed' }));
    await proceedButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      sendInitialDebug: true,
    });
  });
});

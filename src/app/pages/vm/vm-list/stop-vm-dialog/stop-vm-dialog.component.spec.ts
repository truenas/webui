import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { StopVmDialogComponent } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { DialogService } from 'app/services/dialog.service';

describe('StopVmDialogComponent', () => {
  let spectator: Spectator<StopVmDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: StopVmDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 1,
          name: 'test',
        } as VirtualMachine,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('stops a VM when dialog is submitted', async () => {
    const forceCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Force Stop After Timeout' }));
    await forceCheckbox.setValue(true);

    const stopButton = await loader.getHarness(MatButtonHarness.with({ text: 'Stop' }));
    await stopButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ wasStopped: true, forceAfterTimeout: true });
  });
});

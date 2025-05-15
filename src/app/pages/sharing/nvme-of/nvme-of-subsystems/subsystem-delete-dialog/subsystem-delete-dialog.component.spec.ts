import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { SubsystemDeleteDialogComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-delete-dialog/subsystem-delete-dialog.component';

describe('DeleteSubsystemDialogComponent', () => {
  let spectator: Spectator<SubsystemDeleteDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SubsystemDeleteDialogComponent,
    providers: [
      mockAuth(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'subsys-1',
        },
      },
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows subsystem name for confirmation', () => {
    const message = spectator.query('.message');
    expect(message.textContent).toBe('Are you sure you want to delete subsystem subsys-1');
  });

  it('emits right object when delete is clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await button.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ confirmed: true, force: false });
    const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Force' }));
    await checkbox.setValue(true);
    await button.click();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({ confirmed: true, force: true });
  });
});

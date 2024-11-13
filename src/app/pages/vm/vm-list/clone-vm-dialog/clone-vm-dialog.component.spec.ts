import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { ApiService } from 'app/services/api.service';

describe('CloneVmDialogComponent', () => {
  let spectator: Spectator<CloneVmDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CloneVmDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('vm.clone'),
      ]),
      mockAuth(),
      mockProvider(MatDialogRef),
      mockProvider(DialogService),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 1,
        } as VirtualMachine,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('clones VM when dialog is submitted', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Enter a Name (optional)' }));
    await nameInput.setValue('Dolly');

    const cloneButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clone' }));
    await cloneButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.clone', [1, 'Dolly']);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});

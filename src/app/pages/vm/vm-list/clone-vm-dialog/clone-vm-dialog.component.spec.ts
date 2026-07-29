import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';

describe('CloneVmDialogComponent', () => {
  let spectator: Spectator<CloneVmDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CloneVmDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('vm.clone'),
      ]),
      mockAuth(),
      mockProvider(DialogRef),
      mockProvider(DialogService),
      {
        provide: DIALOG_DATA,
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
    const nameInput = await loader.getHarness(TnInputHarness);
    await nameInput.setValue('Dolly');

    const cloneButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clone' }));
    await cloneButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.clone', [1, 'Dolly']);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });
});

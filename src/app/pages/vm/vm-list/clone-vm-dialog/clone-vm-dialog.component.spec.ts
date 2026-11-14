import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnBannerHarness, TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmState } from 'app/enums/vm.enum';
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
        mockCall('vm.clone', null),
      ]),
      mockAuth(),
      mockProvider(DialogRef),
      mockProvider(DialogService),
    ],
  });

  function setup(state: VmState): void {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: { id: 1, status: { state } } as VirtualMachine,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('clones VM when dialog is submitted', async () => {
    setup(VmState.Stopped);

    const nameInput = await loader.getHarness(TnInputHarness);
    await nameInput.setValue('Dolly');

    const cloneButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clone' }));
    await cloneButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.clone', [1, 'Dolly']);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows no warning for a VM that is not suspended', async () => {
    setup(VmState.Running);

    expect(await loader.hasHarness(TnBannerHarness)).toBe(false);
  });

  it('warns that a clone of a suspended VM contains only on-disk state', async () => {
    setup(VmState.Suspended);

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('The clone contains only its on-disk data');
  });
});

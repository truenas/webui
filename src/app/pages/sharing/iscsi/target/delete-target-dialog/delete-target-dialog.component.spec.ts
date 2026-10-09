import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { IscsiTarget, IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { DeleteTargetDialog } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { IscsiService } from 'app/services/iscsi.service';

describe('DeleteTargetDialogComponent', () => {
  let spectator: Spectator<DeleteTargetDialog>;
  let loader: HarnessLoader;
  const target = {
    id: 1,
    name: 'Target1',
  } as IscsiTarget;

  const extents = [
    { id: 1, target: 1 },
    { id: 2, target: 1 },
  ] as IscsiTargetExtent[];

  const createComponent = createComponentFactory({
    component: DeleteTargetDialog,
    imports: [],
    providers: [
      mockAuth(),
      mockTypedApi([
        mockTypedCall('iscsi.target.delete', null),
      ]),
      mockProvider(IscsiService, {
        getGlobalSessions: jest.fn(() => of([{
          target: 'test:1',
        }])),
        getTargetExtents: jest.fn(() => of(extents)),
      }),
      mockProvider(DialogRef),
      { provide: DIALOG_DATA, useValue: target },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes the target when delete button is clicked', async () => {
    const extentsCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Delete 2 associated extents' }));
    await extentsCheckbox.check();
    const forceCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force Delete' }));
    await forceCheckbox.uncheck();

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('iscsi.target.delete', [1, false, true]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('cancels the dialog when cancel button is clicked', async () => {
    const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
    await cancelButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(false);
  });

  it('shows extents checkbox when there are associated extents', async () => {
    const extentsCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Delete 2 associated extents' }));
    expect(extentsCheckbox).toBeTruthy();
  });

  it('shows warning message when target is in use', () => {
    const warningMessages = spectator.queryAll('p');

    expect(warningMessages.find((message) => message.textContent)).toHaveText('Warning: iSCSI Target is currently in use.');
  });
});

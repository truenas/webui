import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiTarget, IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeleteTargetDialogComponent } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { IscsiService } from 'app/services/iscsi.service';

describe('DeleteTargetDialogComponent', () => {
  let spectator: Spectator<DeleteTargetDialogComponent>;
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
    component: DeleteTargetDialogComponent,
    imports: [],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('iscsi.target.delete'),
      ]),
      mockProvider(IscsiService, {
        getGlobalSessions: jest.fn(() => of([{
          target: 'test:1',
        }])),
        getTargetExtents: jest.fn(() => of(extents)),
      }),
      mockProvider(MatDialogRef),
      { provide: MAT_DIALOG_DATA, useValue: target },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes the target when delete button is clicked', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Delete 2 associated extents': true,
      'Force Delete': false,
    });

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.target.delete', [1, false, true]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('cancels the dialog when cancel button is clicked', async () => {
    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await cancelButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });

  it('shows extents checkbox when there are associated extents', async () => {
    const extentsCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Delete 2 associated extents' }));
    expect(extentsCheckbox).toBeTruthy();
  });

  it('shows warning message when target is in use', () => {
    const warningMessages = spectator.queryAll('p');

    expect(warningMessages.find((message) => message.textContent)).toHaveText('Warning: iSCSI Target is currently in use.');
  });
});

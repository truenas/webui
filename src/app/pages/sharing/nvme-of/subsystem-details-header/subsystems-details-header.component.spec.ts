import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfSubsystemDetails } from 'app/pages/sharing/nvme-of/services/nvme-of-subsystem-details.interface';
import {
  SubsystemDeleteDialogComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystem-delete-dialog/subsystem-delete-dialog.component';
import {
  SubsystemsDetailsHeaderComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystems-details-header.component';

describe('SubsystemsDetailsHeaderComponent', () => {
  let spectator: Spectator<SubsystemsDetailsHeaderComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SubsystemsDetailsHeaderComponent,
    providers: [
      mockApi([
        mockCall('nvmet.subsys.delete'),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({ confirmed: true, force: true }),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        subsystem: { id: 1, name: 'Test' } as NvmeOfSubsystemDetails,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('deletes subsystem when delete is pressed', async () => {
    jest.spyOn(spectator.component.subsystemRemoved, 'emit');

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SubsystemDeleteDialogComponent, expect.anything());
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.subsys.delete', [1, { force: true }]);

    expect(spectator.component.subsystemRemoved.emit).toHaveBeenCalled();
  });
});

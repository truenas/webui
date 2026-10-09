import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedCall('nvmet.subsys.delete', true),
      ]),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of({ confirmed: true, force: true }),
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

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(SubsystemDeleteDialogComponent, expect.anything());
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('nvmet.subsys.delete', [1, { force: true }]);

    expect(spectator.component.subsystemRemoved.emit).toHaveBeenCalled();
  });
});

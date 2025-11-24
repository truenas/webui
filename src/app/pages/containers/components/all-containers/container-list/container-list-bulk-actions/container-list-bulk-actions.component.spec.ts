import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { StopOptionsDialog, StopOptionsOperation } from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ContainerListBulkActionsComponent } from './container-list-bulk-actions.component';

describe('ContainerListBulkActionsComponent', () => {
  let spectator: Spectator<ContainerListBulkActionsComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;

  const checkedInstancesMock = [
    { id: '1', status: 'Running' },
    { id: '2', status: 'Stopped' },
  ] as unknown as ContainerInstance[];

  const createComponent = createComponentFactory({
    component: ContainerListBulkActionsComponent,
    imports: [MatMenuModule],
    providers: [
      mockProvider(SnackbarService),
      mockAuth(),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        checkedInstances: checkedInstancesMock,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  });

  it('displays the correct count of selected instances', () => {
    const selectedCount = spectator.query('.bulk-selected span:first-child');
    expect(selectedCount).toHaveText(String(checkedInstancesMock.length));
  });

  it('calls onBulkStart when Start All Selected is clicked', async () => {
    const startSpy = jest.spyOn(spectator.component, 'onBulkStart');

    await menu.open();
    await menu.clickItem({ text: 'Start All Selected' });

    expect(startSpy).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Requested action performed for selected Containers');
  });

  it('opens the Stop Options dialog when Stop All Selected is clicked', async () => {
    const matDialog = spectator.inject(MatDialog);

    await menu.open();
    await menu.clickItem({ text: 'Stop All Selected' });

    expect(matDialog.open).toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Stop });
  });

  it('opens the Restart Options dialog when Restart All Selected is clicked', async () => {
    const matDialog = spectator.inject(MatDialog);

    await menu.open();
    await menu.clickItem({ text: 'Restart All Selected' });

    expect(matDialog.open).toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Restart });
  });

  it('emits resetBulkSelection after actions', () => {
    const resetSpy = jest.spyOn(spectator.component.resetBulkSelection, 'emit');

    spectator.component.onBulkStart();
    expect(resetSpy).toHaveBeenCalled();
  });
});

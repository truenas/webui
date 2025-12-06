import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { StopOptionsDialog, StopOptionsOperation } from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ContainerListBulkActionsComponent } from './container-list-bulk-actions.component';

describe('ContainerListBulkActionsComponent', () => {
  let spectator: Spectator<ContainerListBulkActionsComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;

  const checkedContainersMock = [
    { id: 1, status: { state: ContainerStatus.Running } },
    { id: 2, status: { state: ContainerStatus.Stopped } },
  ] as Container[];

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
      mockProvider(ApiService, {
        call: jest.fn(() => of(undefined)),
        job: jest.fn(() => of(undefined)),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(undefined)),
        })),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: unknown) => source$),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        checkedContainers: checkedContainersMock,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  });

  it('displays the correct count of selected containers', () => {
    const selectedCount = spectator.query('.bulk-selected span:first-child');
    expect(selectedCount).toHaveText(String(checkedContainersMock.length));
  });

  it('calls onBulkStart when Start All Selected is clicked', async () => {
    const startSpy = jest.spyOn(spectator.component, 'onBulkStart');

    await menu.open();
    await menu.clickItem({ text: 'Start All Selected' });
    await spectator.fixture.whenStable();

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

  it('emits resetBulkSelection after actions', async () => {
    const resetSpy = jest.spyOn(spectator.component.resetBulkSelection, 'emit');

    spectator.component.onBulkStart();
    await spectator.fixture.whenStable();

    expect(resetSpy).toHaveBeenCalled();
  });
});

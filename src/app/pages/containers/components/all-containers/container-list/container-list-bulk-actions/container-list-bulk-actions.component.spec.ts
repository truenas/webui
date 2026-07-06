import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
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

  const checkedContainersMock = [
    { id: 1, status: { state: ContainerStatus.Running } },
    { id: 2, status: { state: ContainerStatus.Stopped } },
  ] as Container[];

  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Select action' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  const createComponent = createComponentFactory({
    component: ContainerListBulkActionsComponent,
    providers: [
      mockProvider(SnackbarService),
      mockAuth(),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
          close: jest.fn(),
        } as unknown as DialogRef)),
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

  beforeEach(() => {
    spectator = createComponent({
      props: {
        checkedContainers: checkedContainersMock,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('displays the correct count of selected containers', () => {
    const selectedCount = spectator.query('.bulk-selected span:first-child');
    expect(selectedCount).toHaveText(String(checkedContainersMock.length));
  });

  it('starts stopped containers when Start All Selected is clicked', async () => {
    const menu = await openMenu();
    await menu.clickItem({ label: 'Start All Selected' });
    await spectator.fixture.whenStable();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.start', [2]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Requested action performed for selected Containers');
  });

  it('opens the Stop Options dialog when Stop All Selected is clicked', async () => {
    const tnDialog = spectator.inject(TnDialog);

    const menu = await openMenu();
    await menu.clickItem({ label: 'Stop All Selected' });

    expect(tnDialog.open).toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Stop });
  });

  it('opens the Restart Options dialog when Restart All Selected is clicked', async () => {
    const tnDialog = spectator.inject(TnDialog);

    const menu = await openMenu();
    await menu.clickItem({ label: 'Restart All Selected' });

    expect(tnDialog.open).toHaveBeenCalledWith(StopOptionsDialog, { data: StopOptionsOperation.Restart });
  });

  it('emits resetBulkSelection after actions', async () => {
    const resetSpy = jest.spyOn(spectator.component.resetBulkSelection, 'emit');

    const menu = await openMenu();
    await menu.clickItem({ label: 'Start All Selected' });
    await spectator.fixture.whenStable();

    expect(resetSpy).toHaveBeenCalled();
  });
});

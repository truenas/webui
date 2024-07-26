import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { DockerSettingsComponent } from 'app/pages/apps/components/installed-apps/docker-settings/docker-settings.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { DockerStore } from 'app/pages/apps/store/docker.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AppSettingsButtonComponent', () => {
  let spectator: Spectator<AppSettingsButtonComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  const viewContainerRef: ViewContainerRef = null;

  const createComponent = createComponentFactory({
    component: AppSettingsButtonComponent,
    providers: [
      mockProvider(MatDialog),
      mockProvider(IxSlideInService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(DockerStore, {
        selectedPool: signal('pool'),
      }),
      mockWebSocket([
        mockJob('docker.update'),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    Object.defineProperty(spectator.component, 'viewContainerRef', {
      value: viewContainerRef,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
  });

  it('shows Choose Pool modal once Settings button -> Choose Pool clicked', async () => {
    const matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();

    await menu.open();
    await menu.clickItem({ text: 'Choose Pool' });

    expect(matDialog.open).toHaveBeenCalledWith(SelectPoolDialogComponent, { viewContainerRef });
  });

  it('shows Advanced Settings slide once Settings button -> Advanced Settings clicked', async () => {
    await menu.open();
    await menu.clickItem({ text: 'Advanced Settings' });

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(DockerSettingsComponent);
  });

  it('shows Unset Pool modal once Settings button -> Unset Pool clicked', async () => {
    await menu.open();
    await menu.clickItem({ text: 'Unset Pool' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Confirm to unset pool?',
    }));
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('docker.update', [{ pool: null }]);
  });
});

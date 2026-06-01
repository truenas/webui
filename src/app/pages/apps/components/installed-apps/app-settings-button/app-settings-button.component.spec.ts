import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ViewContainerRef } from '@angular/core';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { SelectPoolDialog } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';

describe('AppSettingsButtonComponent', () => {
  let spectator: Spectator<AppSettingsButtonComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  const viewContainerRef: ViewContainerRef | null = null;

  const createComponent = createComponentFactory({
    component: AppSettingsButtonComponent,
    providers: [
      mockAuth(),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          closed: of(null),
        })),
      }),
      mockProvider(DockerStore, {
        selectedPool$: of('pool'),
        setDockerPool: jest.fn(() => of({})),
      }),
      mockProvider(AppsStore, {
        loadCatalog: jest.fn(() => of({})),
      }),
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
    await menu.open();
    await menu.clickItem({ text: 'Choose Pool' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(SelectPoolDialog, { viewContainerRef });
    expect(spectator.inject(AppsStore).loadCatalog).toHaveBeenCalled();
  });

  it('shows Unset Pool modal once Settings button -> Unset Pool clicked', async () => {
    await menu.open();
    await menu.clickItem({ text: 'Unset Pool' });

    expect(spectator.inject(DialogService).confirm)
      .toHaveBeenCalledWith(expect.objectContaining({
        message: 'Confirm to unset pool?',
      }));
    expect(spectator.inject(DockerStore).setDockerPool).toHaveBeenCalledWith(null);
  });
});

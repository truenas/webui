import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting } from '@truenas/ui-components';
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
  const viewContainerRef: ViewContainerRef | null = null;

  async function openMenu(): Promise<TnMenuHarness> {
    const trigger = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

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
      mockProvider(Router, {
        navigate: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    Object.defineProperty(spectator.component, 'viewContainerRef', {
      value: viewContainerRef,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Choose Pool modal once Settings button -> Choose Pool clicked', async () => {
    const menu = await openMenu();
    await menu.clickItem({ label: 'Choose Pool' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(SelectPoolDialog, { viewContainerRef });
    expect(spectator.inject(AppsStore).loadCatalog).toHaveBeenCalled();
  });

  it('shows Unset Pool modal once Settings button -> Unset Pool clicked', async () => {
    const menu = await openMenu();
    await menu.clickItem({ label: 'Unset Pool' });

    expect(spectator.inject(DialogService).confirm)
      .toHaveBeenCalledWith(expect.objectContaining({
        message: 'Confirm to unset pool?',
      }));
    expect(spectator.inject(DockerStore).setDockerPool).toHaveBeenCalledWith(null);
  });

  it('navigates to Manage Container Images when the menu item is clicked', async () => {
    const menu = await openMenu();
    await menu.clickItem({ label: 'Manage Container Images' });

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'manage-container-images']);
  });
});

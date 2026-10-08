import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { CallResponse } from '@truenas/api-client';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { CatalogConfig } from 'app/interfaces/catalog.interface';
import { DockerConfig } from 'app/interfaces/docker-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { AppsSettingsComponent } from 'app/pages/apps/components/catalog-settings/apps-settings.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { SelectPoolDialog } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';

describe('AppSettingsButtonComponent', () => {
  let spectator: Spectator<AppSettingsButtonComponent>;
  let loader: HarnessLoader;
  let formPanel: FormSidePanelService;
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
      // TypedApiService calls issued by the AppsSettings form rendered inside the side panel.
      mockTypedApi([
        mockTypedCall('catalog.trains', ['stable']),
        mockTypedCall('catalog.config', { preferred_trains: [] } as CatalogConfig),
        mockTypedCall('docker.status', null),
        mockTypedCall('docker.config', { address_pools: [], enable_image_updates: false } as DockerConfig),
        mockTypedCall('system.advanced.nvidia_present', false),
        mockTypedCall('system.advanced.config', { nvidia: false } as CallResponse<WebUiApiDirectory, 'system.advanced.config'>),
        mockTypedJob('docker.update', { state: JobState.Success }),
      ]),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          closed: of(null),
        })),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
      mockProvider(DockerStore, {
        selectedPool$: of('pool'),
        setDockerPool: jest.fn(() => of({})),
      }),
      mockProvider(AppsStore, {
        loadCatalog: jest.fn(() => of({})),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
      mockProvider(Router, {
        navigate: jest.fn(),
      }),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    Object.defineProperty(spectator.component, 'viewContainerRef', {
      value: viewContainerRef,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    formPanel = spectator.inject(FormSidePanelService);
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

  it('opens the Settings form in a side panel when the Settings menu item is clicked', async () => {
    const menu = await openMenu();
    await menu.clickItem({ label: 'Settings' });

    expect(formPanel.open).toHaveBeenCalledWith(AppsSettingsComponent, {
      title: 'Settings',
      testId: 'apps-settings',
    });
  });
});

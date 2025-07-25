import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ViewContainerRef } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { InstallAppButtonComponent } from 'app/pages/apps/components/install-app-button/install-app-button.component';
import { SelectPoolDialog } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

describe('InstallAppButtonComponent', () => {
  let spectator: Spectator<InstallAppButtonComponent>;
  let loader: HarnessLoader;
  const application = {
    name: 'SETI@home',
    train: 'stable',
    installed: false,
  } as AvailableApp;

  const createComponent = createComponentFactory({
    component: InstallAppButtonComponent,
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(ViewContainerRef),
      mockProvider(Router),
      mockProvider(DialogService, { confirm: jest.fn(() => of(true)) }),
      mockAuth(),
      mockApi([mockCall('auth.set_attribute')]),
    ],
  });

  describe('no pool set up', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { app: application },
        providers: [mockProvider(DockerStore, { selectedPool$: of(null) })],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows agreement warning then pool dialog when Setup Pool To Install clicked', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Setup Pool To Install' }));
      await button.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SelectPoolDialog, expect.anything());
    });
  });

  describe('pool is set up', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { app: application },
        providers: [mockProvider(DockerStore, { selectedPool$: of('pool') })],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows warning if user hasn\'t agreed to apps agreement', async () => {
      const authService = spectator.inject(AuthService);
      Object.defineProperty(authService, 'user$', { value: of({ attributes: { appsAgreement: false } }) });

      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
      await installButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    });

    it('navigates to installation form when Install clicked', async () => {
      const installButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
      await installButton.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'stable', 'SETI@home', 'install']);
    });

    it('shows Install Another Container when app is installed', async () => {
      spectator.setInput('app', { ...application, installed: true });

      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Install Another Container' }));
      expect(button).toBeTruthy();

      await button.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/apps', 'available', 'stable', 'SETI@home', 'install']);
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnDialog, TnIconButtonHarness, TnMenuHarness, TnSpriteLoaderService,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { RebootOrShutdownDialog } from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';

describe('PowerMenuComponent', () => {
  let spectator: Spectator<PowerMenuComponent>;
  let loader: HarnessLoader;
  let menu: TnMenuHarness;
  const createComponent = createComponentFactory({
    component: PowerMenuComponent,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of('reason'),
        })),
      }),
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'power' }));
    await trigger.click();
    menu = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture).getHarness(TnMenuHarness);
  });

  it('has a Restart menu item that restarts system after confirmation', async () => {
    await menu.clickItem({ label: 'Restart' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(RebootOrShutdownDialog, {
      width: '430px',
    });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/restart'], {
      skipLocationChange: true,
      queryParams: { reason: 'reason' },
    });
  });

  it('has a Shutdown menu item that shuts down system after confirmation', async () => {
    await menu.clickItem({ label: 'Shut Down' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(RebootOrShutdownDialog, {
      width: '430px',
      data: true,
    });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/shutdown'], {
      skipLocationChange: true,
      queryParams: { reason: 'reason' },
    });
  });
});

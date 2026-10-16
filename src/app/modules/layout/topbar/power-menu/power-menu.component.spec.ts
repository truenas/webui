import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnDialog, TnIconButtonHarness, TnMenuHarness, TnSpriteLoaderService,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { RebootOrShutdownDialog } from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';

describe('PowerMenuComponent', () => {
  let spectator: Spectator<PowerMenuComponent>;
  let menu: TnMenuHarness;
  let heldRoles: Role[];
  const createComponent = createComponentFactory({
    component: PowerMenuComponent,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn((roles: Role[]) => of(roles.some((role) => heldRoles.includes(role)))),
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

  async function setup(roles: Role[]): Promise<void> {
    heldRoles = roles;
    spectator = createComponent();
    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'power' }));
    await trigger.click();
    menu = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  afterEach(() => jest.clearAllMocks());

  describe('as a full admin', () => {
    beforeEach(async () => {
      await setup([Role.FullAdmin]);
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

  describe('without the Full Admin role', () => {
    beforeEach(async () => {
      await setup([Role.ReadonlyAdmin]);
    });

    it('shows Restart and Shut Down disabled, and clicking them opens nothing', async () => {
      expect(await menu.getItemLabels()).toEqual(['Restart', 'Shut Down']);
      expect(await menu.isItemDisabled({ label: 'Restart' })).toBe(true);
      expect(await menu.isItemDisabled({ label: 'Shut Down' })).toBe(true);

      await menu.clickItem({ label: 'Restart' });
      await menu.clickItem({ label: 'Shut Down' });

      expect(spectator.inject(TnDialog).open).not.toHaveBeenCalled();
    });
  });
});

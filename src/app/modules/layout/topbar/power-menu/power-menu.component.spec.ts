import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { RebootOrShutdownDialogComponent } from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';

describe('PowerMenuComponent', () => {
  let spectator: Spectator<PowerMenuComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of('reason')),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  });

  it('has a Restart menu item that restarts system after confirmation', async () => {
    const restart = await menu.getItems({ text: /Restart$/ });
    await restart[0].click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(RebootOrShutdownDialogComponent, {
      width: '430px',
    });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/restart'], {
      skipLocationChange: true,
      queryParams: { reason: 'reason' },
    });
  });

  it('has a Shutdown menu item that shuts down system after confirmation', async () => {
    const shutdown = await menu.getItems({ text: /Shut Down$/ });
    await shutdown[0].click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(RebootOrShutdownDialogComponent, {
      width: '430px',
      data: true,
    });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/shutdown'], {
      skipLocationChange: true,
      queryParams: { reason: 'reason' },
    });
  });
});

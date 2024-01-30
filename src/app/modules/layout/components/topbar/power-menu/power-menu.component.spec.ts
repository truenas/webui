import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { PowerMenuComponent } from 'app/modules/layout/components/topbar/power-menu/power-menu.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

describe('PowerMenuComponent', () => {
  let spectator: Spectator<PowerMenuComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  const isSysAdmin$ = new BehaviorSubject(true);
  const createComponent = createComponentFactory({
    component: PowerMenuComponent,
    providers: [
      mockProvider(AuthService, {
        isSysAdmin$,
        logout: jest.fn(() => of()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router),
      mockProvider(WebSocketConnectionService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  });

  it('has a Log Out menu item that logs user out when pressed', async () => {
    const logout = await menu.getItems({ text: /Log Out$/ });
    await logout[0].click();

    expect(spectator.inject(AuthService).logout).toHaveBeenCalled();
  });

  describe('if logged user is a system administrator', () => {
    it('has a Restart menu item that restarts system after confirmation', async () => {
      const restart = await menu.getItems({ text: /Restart$/ });
      await restart[0].click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Restart the system?',
      }));
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/reboot'], { skipLocationChange: true });
    });

    it('has a Shutdown menu item that shuts down system after confirmation', async () => {
      const shutdown = await menu.getItems({ text: /Shut Down$/ });
      await shutdown[0].click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Shut down the system?',
      }));
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/shutdown'], { skipLocationChange: true });
    });
  });

  it('does not have Restart or Shutdown menu items if logged user is not a system administrator', async () => {
    isSysAdmin$.next(false);
    spectator.detectChanges();
    const restart = await menu.getItems({ text: /Restart$/ });
    const shutdown = await menu.getItems({ text: /Shut Down$/ });

    expect(restart).toHaveLength(0);
    expect(shutdown).toHaveLength(0);
  });
});

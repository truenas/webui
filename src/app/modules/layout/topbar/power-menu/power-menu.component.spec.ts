import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { AuthService } from 'app/services/auth/auth.service';

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

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Restart the system?',
    }));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/restart'], { skipLocationChange: true });
  });

  it('has a Shutdown menu item that shuts down system after confirmation', async () => {
    const shutdown = await menu.getItems({ text: /Shut Down$/ });
    await shutdown[0].click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Shut down the system?',
    }));
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/shutdown'], { skipLocationChange: true });
  });
});

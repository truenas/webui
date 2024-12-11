import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { customAppTrain, customApp } from 'app/constants/catalog.constants';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { SlideInService } from 'app/services/slide-in.service';

describe('CustomAppButtonComponent', () => {
  let spectator: SpectatorRouting<CustomAppButtonComponent>;
  let loader: HarnessLoader;
  let button: MatButtonHarness;

  const createComponent = createRoutingFactory({
    component: CustomAppButtonComponent,
    imports: [
      LazyLoadImageDirective,
      MockComponent(AppCardComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(DockerStore, {
        selectedPool$: of('selected pool'),
      }),
      mockProvider(SlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    button = await loader.getHarness(MatButtonHarness.with({ text: 'Custom App' }));
  });

  it('renders Custom App Button', () => {
    expect(button).toExist();
  });

  it('navigates to create custom app page', async () => {
    await button.click();

    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    expect(router.navigate).toHaveBeenCalledWith([
      '/apps', 'available', customAppTrain, customApp, 'install',
    ]);
  });

  it('disables Custom App button if pool is not set', () => {
    const store = spectator.inject(DockerStore);
    Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
    spectator.detectChanges();

    expect(button.isDisabled()).toBeTruthy();
  });

  it('checks menu and CustomAppForm to install via YAML', async () => {
    const menu = await loader.getHarness(MatMenuHarness);
    await menu.open();

    const installButton = await menu.getItems({ text: /Install via YAML$/ });
    await installButton[0].click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(CustomAppFormComponent, { wide: true });
  });
});

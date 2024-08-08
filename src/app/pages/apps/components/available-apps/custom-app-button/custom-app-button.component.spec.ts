import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { chartsTrain, ixChartApp } from 'app/constants/catalog.constants';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { DockerStore } from 'app/pages/apps/store/docker.service';

// TODO: https://ixsystems.atlassian.net/browse/NAS-129579
describe.skip('CustomAppButtonComponent', () => {
  let spectator: SpectatorRouting<CustomAppButtonComponent>;
  let loader: HarnessLoader;
  let button: MatButtonHarness;

  const createComponent = createRoutingFactory({
    component: CustomAppButtonComponent,
    imports: [],
    declarations: [MockComponent(AppCardComponent)],
    providers: [
      mockAuth(),
      mockProvider(DockerStore, {
        selectedPool$: of('selected pool'),
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
      '/apps', 'available', chartsTrain, ixChartApp, 'install',
    ]);
  });

  it('disables Custom App button if pool is not set', () => {
    const store = spectator.inject(DockerStore);
    Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
    spectator.detectChanges();

    expect(button.isDisabled()).toBeTruthy();
  });
});

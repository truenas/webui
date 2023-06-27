import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { CustomAppButtonComponent } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

describe('CustomAppButtonComponent', () => {
  let spectator: SpectatorRouting<CustomAppButtonComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: CustomAppButtonComponent,
    imports: [],
    declarations: [MockComponent(AppCardComponent)],
    providers: [
      mockProvider(AppsStore, {
        selectedPool$: of('selected pool'),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders Custom App Button', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Custom App' }));
    expect(button).toExist();
  });

  it('navigates to create custom app page', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Custom App' }));

    await button.click();

    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    expect(router.navigate).toHaveBeenCalledWith([
      '/apps', 'available', officialCatalog, chartsTrain, ixChartApp, 'install',
    ]);
  });

  it('disables Custom App button if pool is not set', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Custom App' }));

    const store = spectator.inject(AppsStore);
    Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });

    expect(button.isDisabled()).toBeTruthy();
  });
});

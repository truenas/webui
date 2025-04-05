import { BreakpointObserver } from '@angular/cdk/layout';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ProductType } from 'app/enums/product-type.enum';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { TruenasLogoComponent } from 'app/modules/layout/topbar/truenas-logo/truenas-logo.component';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { selectSystemInfoState } from 'app/store/system-info/system-info.selectors';

describe('TruenasLogoComponent', () => {
  let spectator: Spectator<TruenasLogoComponent>;
  let loader: HarnessLoader;
  let icons: IxIconHarness[];

  const createComponent = createComponentFactory({
    component: TruenasLogoComponent,
    providers: [
      mockProvider(ThemeService, {
        activeTheme$: of('ix-dark'),
      }),
      mockProvider(BreakpointObserver, {
        observe: () => of({
          matches: false,
        }),
      }),
      provideMockStore({
        selectors: [{
          selector: selectSystemInfoState,
          value: {
            productType: ProductType.CommunityEdition,
          } as SystemInfoState,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    icons = await loader.getAllHarnesses(IxIconHarness);
  });

  it('community-edition: shows a logotype', async () => {
    const [mark, text] = icons;
    expect(await mark.getName()).toBe('ix-truenas-logo-mark-color');
    expect(await text.getName()).toBe('ix-truenas-logo-type-color');
  });

  it('community-edition: shows full logo in color', async () => {
    spectator.setInput('fullSize', true);
    icons = await loader.getAllHarnesses(IxIconHarness);
    expect(await icons[0].getName()).toBe('ix-truenas-logo-ce-color');
  });

  it('community-edition: shows full logo in white', async () => {
    spectator.setInput('fullSize', true);
    spectator.setInput('color', 'white');
    icons = await loader.getAllHarnesses(IxIconHarness);
    expect(await icons[0].getName()).toBe('ix-truenas-logo-ce');
  });

  it('enterprise: shows a logotype', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectSystemInfoState, {
      productType: ProductType.Enterprise,
    });
    store$.refreshState();

    const [mark, text] = icons;
    expect(await mark.getName()).toBe('ix-truenas-logo-mark-color');
    expect(await text.getName()).toBe('ix-truenas-logo-type-color');
  });

  it('enterprise: shows full logo in color', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectSystemInfoState, {
      productType: ProductType.Enterprise,
    });
    store$.refreshState();
    spectator.setInput('fullSize', true);
    icons = await loader.getAllHarnesses(IxIconHarness);

    expect(await icons[0].getName()).toBe('ix-truenas-logo-enterprise-color');
  });

  it('enterprise: shows full logo in white', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectSystemInfoState, {
      productType: ProductType.Enterprise,
    });
    store$.refreshState();
    spectator.setInput('fullSize', true);
    spectator.setInput('color', 'white');
    icons = await loader.getAllHarnesses(IxIconHarness);

    expect(await icons[0].getName()).toBe('ix-truenas-logo-enterprise');
  });

  it('checks white color', async () => {
    spectator.setInput('color', 'white');
    const [mark, text] = icons;
    expect(icons).toHaveLength(2);
    expect(await mark.getName()).toBe('ix-truenas-logo-mark');
    expect(await text.getName()).toBe('ix-truenas-logo-type');
  });

  it('checks when logo text is hidden', async () => {
    spectator.setInput('hideText', true);
    icons = await loader.getAllHarnesses(IxIconHarness);
    expect(icons).toHaveLength(1);
    expect(await icons[0].getName()).toBe('ix-truenas-logo-mark-color');
  });
});

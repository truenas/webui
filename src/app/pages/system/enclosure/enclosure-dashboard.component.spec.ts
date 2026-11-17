import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnEmptyHarness, TnSpinnerComponent } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/enclosure-dashboard.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureDashboardComponent', () => {
  let spectator: SpectatorRouting<EnclosureDashboardComponent>;
  let loader: HarnessLoader;
  const isLoading = signal(false);
  const selectedEnclosure = signal<DashboardEnclosure | undefined>(undefined);
  const createComponent = createRoutingFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    componentProviders: [
      mockProvider(EnclosureStore, {
        selectedEnclosure,
        isLoading,
        initiate: jest.fn(),
        listenForDiskUpdates: jest.fn(() => of()),
        selectEnclosure: jest.fn(),
      }),
    ],
    providers: [
      mockApi([
        mockCall('jbof.licensed', 5),
      ]),
      mockProvider(TnDialog),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    isLoading.set(false);
    selectedEnclosure.set(undefined);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows loading indicator when enclosures are loading', () => {
    isLoading.set(true);
    spectator.detectChanges();

    // `tn-empty` has no loading variant, so loading renders a spinner instead.
    expect(spectator.query(TnSpinnerComponent)).toExist();
  });

  it('shows unavailable message when no enclosure is available after loading', async () => {
    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('Enclosure Unavailable');
  });

  it('initializes store when component is initialized', () => {
    expect(spectator.inject(EnclosureStore, true).initiate).toHaveBeenCalled();
  });

  it('selects an enclosure when router param changes', () => {
    spectator.setRouteParam('enclosure', '123');

    expect(spectator.inject(EnclosureStore, true).selectEnclosure).toHaveBeenCalledWith('123');
  });

  it('links to the JBOF list when the system is licensed for expansion shelves', async () => {
    const link = await loader.getHarness(TnButtonHarness.with({ label: 'NVMe-oF Expansion Shelves' }));

    // Anchor-mode render, so middle-click / copy-link still work. The exact href isn't
    // asserted — the routing stub resolves every createUrlTree() to '/'.
    expect(await link.getHref()).not.toBeNull();

    // `tn-button`'s anchor arm hard-codes `tnTestIdType="button"`, so the legacy `link-*` id
    // is pinned on the host. Guards against a silent rename to `button-manage-expansion`.
    expect(spectator.query('tn-button')).toHaveAttribute('data-test', 'link-manage-expansion');
  });
});

describe('EnclosureDashboardComponent (unlicensed)', () => {
  let spectator: SpectatorRouting<EnclosureDashboardComponent>;
  let loader: HarnessLoader;

  // `isJbofLicensed` is resolved once at construction, so the unlicensed case needs its own
  // factory rather than a re-mock inside a test.
  const createComponent = createRoutingFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    componentProviders: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: signal(undefined),
        isLoading: signal(false),
        initiate: jest.fn(),
        listenForDiskUpdates: jest.fn(() => of()),
        selectEnclosure: jest.fn(),
      }),
    ],
    providers: [
      mockApi([
        mockCall('jbof.licensed', 0),
      ]),
      mockProvider(TnDialog),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('does not show the JBOF link', async () => {
    const links = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'NVMe-oF Expansion Shelves' }));

    expect(links).toHaveLength(0);
  });
});

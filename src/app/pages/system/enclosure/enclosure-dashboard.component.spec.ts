import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnEmptyHarness, TnSpinnerComponent } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/enclosure-dashboard.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureDashboardComponent', () => {
  let spectator: SpectatorRouting<EnclosureDashboardComponent>;
  let loader: HarnessLoader;
  const createComponent = createRoutingFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    declarations: [
      MockComponent(PageHeaderComponent),
    ],
    componentProviders: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: jest.fn(),
        isLoading: jest.fn(),
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
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows loading indicator when enclosures are loading', () => {
    const enclosureStore = spectator.inject(EnclosureStore, true);
    enclosureStore.isLoading.mockReturnValue(true);
    enclosureStore.selectedEnclosure.mockReturnValue(undefined);

    // OnPush: the store mock is a plain jest.fn, so the component has to be marked dirty.
    spectator.detectComponentChanges();

    // `tn-empty` has no loading variant, so loading renders a spinner instead.
    expect(spectator.query(TnSpinnerComponent)).toExist();

    // Verify store methods are being called correctly
    expect(enclosureStore.isLoading).toHaveBeenCalled();
    expect(enclosureStore.selectedEnclosure).toHaveBeenCalled();
  });

  it('shows unavailable message when no enclosure is available after loading', async () => {
    const enclosureStore = spectator.inject(EnclosureStore, true);
    enclosureStore.isLoading.mockReturnValue(false);
    enclosureStore.selectedEnclosure.mockReturnValue(undefined);

    // OnPush: the store mock is a plain jest.fn, so the component has to be marked dirty.
    spectator.detectComponentChanges();

    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('Enclosure Unavailable');

    // Verify store methods are being called correctly
    expect(enclosureStore.isLoading).toHaveBeenCalled();
    expect(enclosureStore.selectedEnclosure).toHaveBeenCalled();
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
        selectedEnclosure: jest.fn(),
        isLoading: jest.fn(),
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

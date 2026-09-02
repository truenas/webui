import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnEmptyHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { DashboardPoolComponent } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.component';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { TierConfigFormComponent } from 'app/pages/storage/components/tier-config-form/tier-config-form.component';
import { UnusedResourcesComponent } from 'app/pages/storage/components/unused-resources/unused-resources.component';
import { PoolsDashboardComponent } from 'app/pages/storage/pools-dashboard.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';

describe('PoolsDashboardComponent', () => {
  let spectator: Spectator<PoolsDashboardComponent>;
  let loader: HarnessLoader;

  const pools = signal<Pool[]>([{ id: 1, name: 'tank' } as Pool]);
  const arePoolsLoading = signal(false);

  const storeMock = {
    pools,
    arePoolsLoading,
    isLoadingPoolDetails: signal(false),
    disksByPool: signal<Record<string, unknown[]>>({}),
    rootDatasets$: of({}),
    loadDashboard: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: PoolsDashboardComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
      MockComponent(DashboardPoolComponent),
      MockComponent(UnusedResourcesComponent),
    ],
    // The component provides PoolsDashboardStore itself, so a TestBed-level provider is shadowed.
    // Not mockProvider either: it stubs every function-valued property, and signals are functions.
    componentProviders: [
      { provide: PoolsDashboardStore, useValue: storeMock },
    ],
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(true)),
      }),
      mockProvider(SharingTierService, {
        getTierConfig: () => of({ enabled: false }),
        invalidate: jest.fn(),
      }),
      provideMockStore({
        // Loaded map with no gated keys, i.e. entitled to everything.
        selectors: [{ selector: selectEntitlements, value: {} }],
      }),
    ],
  });

  beforeEach(() => {
    pools.set([{ id: 1, name: 'tank' } as Pool]);
    arePoolsLoading.set(false);
    jest.clearAllMocks();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens the import-pool form in a footerless side panel and reloads the dashboard', async () => {
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Import Pool' }))).click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ImportPoolComponent,
      expect.objectContaining({ title: 'Import Pool', footerless: true }),
    );
    // Once from ngOnInit, once from the panel's onSuccess callback.
    expect(storeMock.loadDashboard).toHaveBeenCalledTimes(2);
  });

  it('opens the tier config form in a side panel and refreshes the tier config', async () => {
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Tiering' }))).click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      TierConfigFormComponent,
      expect.objectContaining({ title: 'Tiering' }),
    );
    expect(spectator.inject(SharingTierService).invalidate).toHaveBeenCalled();
  });

  it('hides the Tiering button when the system is not entitled to ZFSTIER', async () => {
    spectator.inject(MockStore).overrideSelector(selectEntitlements, {
      [EntitlementFeature.ZfsTier]: {
        entitled: false,
        reason: EntitlementReason.KeyMissing,
        message: "This system's license does not include ZFS tiering.",
      },
    });
    spectator.inject(MockStore).refreshState();
    spectator.detectChanges();

    const tiering = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Tiering' }));
    expect(tiering).toBeNull();

    // Disks sits beside it and is ungated — proves the toolbar rendered.
    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Disks' }))).not.toBeNull();
  });

  it('renders the header navigations as links under their legacy link-* test ids', () => {
    // Ids are host-pinned, not passed through `[testId]` — see the note in the template.
    expect(spectator.query('[data-test="link-disks"] a')).toHaveAttribute('href', '/storage/disks');
    expect(spectator.query('[data-test="link-create-pool"] a')).toHaveAttribute('href', '/storage/create');
  });

  it('shows the pool list and hides the empty state when pools exist', async () => {
    expect(spectator.queryAll('ix-dashboard-pool')).toHaveLength(1);
    expect(await loader.getHarnessOrNull(TnEmptyHarness)).toBeNull();
  });

  it('shows the empty state with a Create Pool action when there are no pools', async () => {
    pools.set([]);
    spectator.detectChanges();

    expect(await loader.getHarnessOrNull(TnEmptyHarness)).not.toBeNull();

    // The action is rendered as a sibling of tn-empty so that it can carry a test id;
    // it must still link to the pool-creation wizard.
    const createPool = await loader.getHarness(TnButtonHarness.with({ label: 'Create Pool' }));
    expect(await createPool.getHref()).toBe('/storage/create');
  });
});

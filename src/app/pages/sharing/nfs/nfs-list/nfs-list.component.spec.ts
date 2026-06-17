import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { Subject, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

const shares: Partial<NfsShare>[] = [
  {
    id: 1,
    enabled: true,
    hosts: ['host1', 'host2'],
    networks: ['network1', 'network2'],
    comment: 'comment',
    path: 'some-path',
  },
];

const slideInRef: SlideInRef<NfsShare | undefined, unknown> = {
  close: jest.fn(),
  requireConfirmationWhen: jest.fn(),
  getData: jest.fn((): undefined => undefined),
};

const commonProviders = [
  mockAuth(),
  mockProvider(EmptyService),
  mockProvider(SlideInRef, slideInRef),
  mockProvider(DialogService, {
    confirm: jest.fn(() => of(true)),
    confirmDelete: jest.fn(() => of(undefined)),
  }),
  mockProvider(SlideIn, {
    open: jest.fn(() => SlideInResult.empty()),
  }),
  provideMockStore({
    selectors: [
      {
        selector: selectIsEnterprise,
        value: true,
      },
      {
        selector: selectPreferences,
        value: {},
      },
    ],
  }),
];

describe('NfsListComponent', () => {
  let spectator: Spectator<NfsListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: NfsListComponent,
    providers: [
      ...commonProviders,
      mockApi([
        mockCall('sharing.nfs.query', shares as NfsShare[]),
        mockCall('sharing.nfs.delete'),
        mockCall('sharing.nfs.update'),
        mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
      ]),
      mockSharingTierService({ enabled: false }),
    ],
  });

  async function openRowMenu(): Promise<TnMenuHarness> {
    spectator.click('[data-test$="more-action"]');
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('NFS');
  });

  it('opens the side panel for a new share when "Add" is pressed', () => {
    spectator.component.doAdd();

    expect(spectator.component.configOpen()).toBe(true);
    expect(spectator.component.formData()).toBeUndefined();
  });

  it('opens the side panel with the row data when "Edit" is pressed', () => {
    spectator.component.doEdit(shares[0] as NfsShare);

    expect(spectator.component.configOpen()).toBe(true);
    expect(spectator.component.formData()).toEqual({ existingNfsShare: shares[0] });
  });

  it('opens delete dialog when "Delete" is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
      call: expect.any(Function),
    });
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Path', 'Description', 'Networks', 'Hosts', 'Enabled', 'Expose Snapshots', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['some-path', 'comment', 'network1, network2', 'host1, host2', '', 'No', ''],
    ]);
  });

  describe('with exported pool shares', () => {
    const createExportedComponent = createComponentFactory({
      component: NfsListComponent,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...shares[0],
            path: '/mnt/exported/data',
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: false }),
      ],
    });

    beforeEach(() => {
      spectator = createExportedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should disable toggle when share is on an exported pool', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(true);
    });
  });

  describe('with locked shares', () => {
    const createLockedComponent = createComponentFactory({
      component: NfsListComponent,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...shares[0],
            locked: true,
            path: '/mnt/pool/data',
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: false }),
      ],
    });

    beforeEach(() => {
      spectator = createLockedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should disable toggle when share is locked', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(true);
    });
  });

  describe('tier refresh integration', () => {
    const jobUpdates$ = new Subject<ZfsTierRewriteJobEntry>();

    const createTierComponent = createComponentFactory({
      component: NfsListComponent,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', shares as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: true, jobUpdates$ }),
      ],
    });

    beforeEach(() => {
      spectator = createTierComponent();
      spectator.detectChanges();
    });

    it('reloads shares when a tier job update is emitted', () => {
      const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');
      jobUpdates$.next({ tier_job_id: 'job-1' } as ZfsTierRewriteJobEntry);
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('Change Storage Tier action hidden when tier missing', () => {
    const createNoTierComponent = createComponentFactory({
      component: NfsListComponent,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...shares[0],
            path: '/mnt/pool/data',
            tier: null,
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: true }),
      ],
    });

    beforeEach(async () => {
      spectator = createNoTierComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('does not show Change Storage Tier in the action menu', async () => {
      const menu = await openRowMenu();
      const labels = await menu.getItemLabels();
      expect(labels.some((label) => label.includes('Change Storage Tier'))).toBe(false);
    });
  });

  describe('Change Storage Tier action hidden when row is locked', () => {
    const createLockedTierComponent = createComponentFactory({
      component: NfsListComponent,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.nfs.query', [{
            ...shares[0],
            path: '/mnt/pool/data',
            locked: true,
            tier: { tier_type: DatasetTier.Performance, tier_job: null },
          }] as NfsShare[]),
          mockCall('sharing.nfs.delete'),
          mockCall('sharing.nfs.update'),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: true }),
      ],
    });

    beforeEach(async () => {
      spectator = createLockedTierComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('does not show Change Storage Tier in the action menu', async () => {
      const menu = await openRowMenu();
      const labels = await menu.getItemLabels();
      expect(labels.some((label) => label.includes('Change Storage Tier'))).toBe(false);
    });
  });
});

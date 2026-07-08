import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCardComponent, TnIconButtonHarness, TnMenuHarness, TnMenuTesting,
  TnSlideToggleHarness, TnTableHarness,
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
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
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

// The add/edit form is opened through FormSidePanelService, which hosts it in
// its own side-panel container — the list only asserts the open() contract.
const commonProviders = [
  mockAuth(),
  mockProvider(EmptyService),
  mockProvider(DialogService, {
    confirm: jest.fn(() => of(true)),
    confirmDelete: jest.fn(() => of(undefined)),
  }),
  mockProvider(FormSidePanelService, {
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
    const trigger = await loader.getHarness(TnIconButtonHarness.with({ name: 'dots-vertical' }));
    await trigger.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows accurate page title', () => {
    // White-box: no TnCardHarness in @truenas/ui-components yet.
    expect(spectator.query(TnCardComponent)!.title()).toBe('NFS');
  });

  it('opens the form in a side panel when "Add" is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(NfsFormComponent, {
      title: 'Add NFS Share',
      inputs: { nfsShareData: { existingNfsShare: undefined } },
    });
  });

  it('opens the form with the row data when "Edit" is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(NfsFormComponent, {
      title: 'Edit NFS Share',
      inputs: { nfsShareData: { existingNfsShare: shares[0] } },
    });
  });

  it('reloads the list after a successful form submission', async () => {
    jest.spyOn(spectator.inject(FormSidePanelService), 'open').mockReturnValue(SlideInResult.success(true));
    const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(loadSpy).toHaveBeenCalled();
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

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCardComponent, TnDialog, TnIconButtonHarness, TnMenuHarness, TnMenuTesting, TnSidePanelHarness,
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
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
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

// No SlideInRef/SlideIn providers: the add/edit form is hosted in <tn-side-panel>,
// and the absence of SlideInRef is what switches NfsFormComponent into panel mode.
const commonProviders = [
  mockAuth(),
  mockProvider(EmptyService),
  mockProvider(DialogService, {
    confirm: jest.fn(() => of(true)),
    confirmDelete: jest.fn(() => of(undefined)),
  }),
  // Providers for the real NfsFormComponent rendered inside the side panel.
  mockProvider(FilesystemService),
  mockProvider(UserService),
  mockProvider(TnDialog),
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

  it('opens the side panel hosting the form when "Add" is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    const panel = await loader.getHarness(TnSidePanelHarness);
    expect(await panel.isOpen()).toBe(true);
    expect(await panel.getTitle()).toBe('Add NFS Share');

    const form = spectator.query(NfsFormComponent);
    expect(form).toBeTruthy();
    expect(form?.data()).toBeUndefined();
  });

  it('opens the side panel with the row data when "Edit" is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    const panel = await loader.getHarness(TnSidePanelHarness);
    expect(await panel.isOpen()).toBe(true);
    expect(await panel.getTitle()).toBe('Edit NFS Share');

    const form = spectator.query(NfsFormComponent);
    expect(form?.data()).toEqual({ existingNfsShare: shares[0] });
  });

  it('disables the panel Save action until the hosted form can submit', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    // The panel footer is portaled to document.body, so use the document-root loader.
    // The freshly opened form is invalid (Path is required), so the footer Save is disabled.
    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    const saveButton = await rootLoader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('closes the panel and reloads the list when the hosted form reports it saved', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');
    const form = spectator.query(NfsFormComponent);
    form.closed.emit(true);
    spectator.detectChanges();

    const panel = await loader.getHarness(TnSidePanelHarness);
    expect(await panel.isOpen()).toBe(false);
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

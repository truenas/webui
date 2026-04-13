import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
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

const slideInRef: SlideInRef<NfsShare | undefined, unknown> = {
  close: jest.fn(),
  requireConfirmationWhen: jest.fn(),
  getData: jest.fn((): undefined => undefined),
};

const commonImports = [
  BasicSearchComponent,
  IxTableColumnsSelectorComponent,
  FakeProgressBarComponent,
];

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
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: NfsListComponent,
    imports: commonImports,
    providers: [
      ...commonProviders,
      mockApi([
        mockCall('sharing.nfs.query', shares as NfsShare[]),
        mockCall('sharing.nfs.delete'),
        mockCall('sharing.nfs.update'),
        mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('NFS');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent);
  });

  it('opens nfs share form when "Edit" button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
      data: { existingNfsShare: shares[0] },
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
      call: expect.any(Function),
    });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Path', 'Description', 'Networks', 'Hosts', 'Enabled', 'Expose Snapshots', ''],
      ['some-path', 'comment', 'network1, network2', 'host1, host2', '', 'No', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  describe('with exported pool shares', () => {
    const createExportedComponent = createComponentFactory({
      component: NfsListComponent,
      imports: commonImports,
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
      ],
    });

    beforeEach(async () => {
      spectator = createExportedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);
    });

    it('should disable toggle when share is on an exported pool', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);
      expect(await toggle.isDisabled()).toBe(true);
    });
  });

  describe('with locked shares', () => {
    const createLockedComponent = createComponentFactory({
      component: NfsListComponent,
      imports: commonImports,
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
      ],
    });

    beforeEach(async () => {
      spectator = createLockedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(IxTableHarness);
    });

    it('should disable toggle when share is locked', async () => {
      const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 4);
      expect(await toggle.isDisabled()).toBe(true);
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnMenuHarness, TnMenuTesting, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { SmbFormData } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { SmbListComponent } from 'app/pages/sharing/smb/smb-list/smb-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectServices } from 'app/store/services/services.selectors';

const shares: Partial<SmbShare>[] = [
  {
    id: 1,
    enabled: true,
    name: 'some-name',
    comment: 'comment',
    path: '/some-path',
    audit: {
      enable: true,
    },
  },
];

const slideInRef: SlideInRef<SmbShare | undefined, unknown> = {
  close: jest.fn(),
  requireConfirmationWhen: jest.fn(),
  getData: jest.fn((): undefined => undefined),
};

const commonDeclarations = [
  MockComponents(
    ServiceStateButtonComponent,
  ),
];

const commonProviders = [
  mockProvider(EmptyService),
  mockAuth(),
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
        selector: selectServices,
        value: [{
          id: 4,
          service: ServiceName.Cifs,
          state: ServiceStatus.Stopped,
          enable: false,
        } as Service],
      },
      {
        selector: selectPreferences,
        value: {},
      },
    ],
  }),
];

describe('SmbListComponent', () => {
  let spectator: Spectator<SmbListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: SmbListComponent,
    declarations: commonDeclarations,
    providers: [
      ...commonProviders,
      mockApi([
        mockCall('sharing.smb.query', shares as SmbShare[]),
        mockCall('sharing.smb.delete'),
        mockCall('sharing.smb.update'),
        mockCall('sharing.smb.getacl', { share_name: 'acl_share_name' } as SmbSharesec),
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
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    // override the URL to what it would normally be so we can verify that
    // the list component supplies the router's value to the store.
    Object.defineProperty(router, 'url', {
      value: '/sharing/smb',
      writable: false,
    });
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('SMB');
  });

  it('opens the side panel for a new share when "Add" is pressed', () => {
    spectator.component.doAdd();

    expect(spectator.component.formOpen()).toBe(true);
    expect(spectator.component.formData()).toBeUndefined();
  });

  it('opens the side panel with the row data when "Edit" is pressed', () => {
    spectator.component.doEdit(shares[0] as SmbShare);

    expect(spectator.component.formOpen()).toBe(true);
    expect(spectator.component.formData()).toEqual({ existingSmbShare: shares[0] } as SmbFormData);
  });

  it('opens the ACL side panel with the resolved share name when "Edit Share ACL" is pressed', () => {
    spectator.component.actions[1].onClick(shares[0] as SmbShare);

    expect(spectator.component.aclOpen()).toBe(true);
    expect(spectator.component.aclShareName()).toBe('acl_share_name');
  });

  it('redirects to edit ACL page when "Edit Filesystem ACL" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Edit Filesystem ACL' });

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
      ['/', 'datasets', 'acl', 'edit'],
      { queryParams: { path: '/some-path', returnUrl: '/sharing/smb' } },
    );
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const menu = await openRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
      buttonText: expect.any(String),
      call: expect.any(Function),
    });
  });

  it('updates SMB Enabled status once the toggle is updated', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));

    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'sharing.smb.update',
      [1, { enabled: false }],
    );
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Name', 'Path', 'Description', 'Enabled', 'Audit Logging', '',
    ]);
    expect(await table.getAllRowTexts()).toEqual([
      ['some-name', '/some-path', 'comment', '', 'Yes', ''],
    ]);
  });

  describe('with exported pool shares', () => {
    const createExportedComponent = createComponentFactory({
      component: SmbListComponent,
      declarations: commonDeclarations,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.smb.query', [{
            ...shares[0],
            path: '/mnt/exported/data',
          }] as SmbShare[]),
          mockCall('sharing.smb.delete'),
          mockCall('sharing.smb.update'),
          mockCall('sharing.smb.getacl', { share_name: 'acl_share_name' } as SmbSharesec),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: false }),
      ],
    });

    beforeEach(async () => {
      spectator = createExportedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('should disable toggle when share is on an exported pool', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(true);
    });

    it('should disable Edit Share ACL for exported pool shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: /Edit Share ACL/ })).toBe(true);
    });

    it('should disable Edit Filesystem ACL for exported pool shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: /Edit Filesystem ACL/ })).toBe(true);
    });
  });

  describe('with locked shares', () => {
    const createLockedComponent = createComponentFactory({
      component: SmbListComponent,
      declarations: commonDeclarations,
      providers: [
        ...commonProviders,
        mockApi([
          mockCall('sharing.smb.query', [{
            ...shares[0],
            locked: true,
            path: '/mnt/pool/data',
          }] as SmbShare[]),
          mockCall('sharing.smb.delete'),
          mockCall('sharing.smb.update'),
          mockCall('sharing.smb.getacl', { share_name: 'acl_share_name' } as SmbSharesec),
          mockCall('pool.query', [{ path: '/mnt/pool' }] as Pool[]),
        ]),
        mockSharingTierService({ enabled: false }),
      ],
    });

    beforeEach(async () => {
      spectator = createLockedComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      table = await loader.getHarness(TnTableHarness);
    });

    it('should disable toggle when share is locked', async () => {
      const toggle = await loader.getHarness(TnSlideToggleHarness.with({ ancestor: 'tn-table' }));
      expect(await toggle.isDisabled()).toBe(true);
    });

    it('should disable Edit Share ACL for locked shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: /Edit Share ACL/ })).toBe(true);
    });

    it('should disable Edit Filesystem ACL for locked shares', async () => {
      const menu = await openRowMenu();
      expect(await menu.isItemDisabled({ label: /Edit Filesystem ACL/ })).toBe(true);
    });
  });
});

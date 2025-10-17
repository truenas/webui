import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { provideRouter } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('NfsCardComponent', () => {
  let spectator: Spectator<NfsCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const nfsShares = [
    {
      id: 10,
      path: '/mnt/x',
      aliases: [] as string[],
      comment: 'sweet',
      hosts: [] as string[],
      ro: false,
      maproot_user: '',
      maproot_group: '',
      mapall_user: '',
      mapall_group: '',
      security: [] as NfsSecurityProvider[],
      enabled: true,
      networks: [] as string[],
      locked: false,
    },
  ] as NfsShare[];

  const slideInRef: SlideInRef<NfsShare | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: NfsCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('sharing.nfs.query', nfsShares),
        mockCall('sharing.nfs.delete'),
        mockCall('sharing.nfs.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              id: 4,
              service: ServiceName.Nfs,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
      provideRouter([]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Path', 'Description', 'Enabled', ''],
      ['/mnt/x', 'sweet', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing NFS Share when Edit button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
      data: { existingNfsShare: expect.objectContaining(nfsShares[0]) },
    });
  });

  it('shows confirmation to delete NFS Share when Delete button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
  });

  it('updates NFS Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);

    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'sharing.nfs.update',
      [10, { enabled: false }],
    );
  });

  it('returns correct card title', () => {
    expect(spectator.component.cardTitle()).toBe('UNIX (NFS) Shares');
  });

  it('returns correct header status for stopped service', () => {
    const status = spectator.component.headerStatus();
    expect(status).toEqual({
      label: 'STOPPED',
      type: 'error',
    });
  });

  it('returns correct footer link with shares count', () => {
    const footerLink = spectator.component.footerLink();
    expect(footerLink.label).toBe('View All 1');
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SmbPresetType, SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectServices } from 'app/store/services/services.selectors';

describe('SmbCardComponent', () => {
  let spectator: Spectator<SmbCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const smbShares = [
    {
      id: 3,
      purpose: SmbPresetType.MultiUserTimeMachine,
      path: '/mnt/APPS/smb1',
      home: true,
      name: 'smb123',
      comment: 'pool',
      vuid: '04305a6f-7a37-43dc-8fc0-fe6662751437',
      enabled: true,
      path_local: '/mnt/APPS/smb1',
      audit: {
        enable: true,
      },
    },
  ] as SmbShare[];

  const createComponent = createComponentFactory({
    component: SmbCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('sharing.smb.query', smbShares),
        mockCall('sharing.smb.delete'),
        mockCall('sharing.smb.update'),
        mockCall('sharing.smb.getacl', { share_name: 'test' } as SmbSharesec),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(SlideInRef),
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
              service: ServiceName.Cifs,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Path', 'Description', 'Enabled', 'Audit Logging', ''],
      ['smb123', '/mnt/APPS/smb1', 'pool', '', 'Yes', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing SMB Share when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmbFormComponent, {
      data: { existingSmbShare: expect.objectContaining(smbShares[0]) },
    });
  });

  it('shows confirmation to delete SMB Share when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
  });

  it('updates SMB Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 3);

    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'sharing.smb.update',
      [3, { enabled: false }],
    );
  });

  it('handles edit Share ACL', async () => {
    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'share' }), 1, 5);
    await editIcon.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'sharing.smb.getacl',
      [{ share_name: 'homes' }],
    );

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmbAclComponent, { data: 'test' });
  });

  it('handles edit Filesystem ACL', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'security' }), 1, 5);
    await editIcon.click();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/', 'datasets', 'acl', 'edit'],
      { queryParams: { path: '/mnt/APPS/smb1' } },
    );
  });
});

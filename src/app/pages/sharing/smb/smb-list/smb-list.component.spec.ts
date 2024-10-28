import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { SmbListComponent } from 'app/pages/sharing/smb/smb-list/smb-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectServices } from 'app/store/services/services.selectors';

const shares: Partial<SmbShare>[] = [
  {
    id: 1,
    enabled: true,
    name: 'some-name',
    comment: 'comment',
    path: 'some-path',
    path_local: 'some-local-path',
    audit: {
      enable: true,
    },
  },
];

describe('SmbListComponent', () => {
  let spectator: Spectator<SmbListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: SmbListComponent,
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
      ),
    ],
    providers: [
      mockProvider(EmptyService),
      mockWebSocket([
        mockCall('sharing.smb.query', shares as SmbShare[]),
        mockCall('sharing.smb.delete'),
        mockCall('sharing.smb.update'),
        mockCall('sharing.smb.getacl', { share_name: 'acl_share_name' } as SmbSharesec),
      ]),
      mockAuth(),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
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
    jest.spyOn(spectator.inject(Router), 'navigate').mockImplementation();
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('SMB');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmbFormComponent);
  });

  it('opens smb edit form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmbFormComponent, {
      data: { existingSmbShare: shares[0] },
    });
  });

  it('opens smb edit share ACL form when "Edit Share ACL" button is pressed', async () => {
    const editShareAclButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'share' }), 1, 5);
    await editShareAclButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(SmbAclComponent, {
      data: 'acl_share_name',
    });
  });

  it('redirects to edit ACL page when "Edit Filesystem ACL" button is pressed', async () => {
    const editFilesystemAclButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'security' }), 1, 5);
    await editFilesystemAclButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
      ['/', 'datasets', 'acl', 'edit'],
      { queryParams: { path: 'some-local-path' } },
    );
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('sharing.smb.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Path', 'Description', 'Enabled', 'Audit Logging', ''],
      ['some-name', 'some-local-path', 'comment', '', 'Yes', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});

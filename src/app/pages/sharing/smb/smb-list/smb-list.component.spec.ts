import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of, pipe } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { SmbListComponent } from 'app/pages/sharing/smb/smb-list/smb-list.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
  },
];

describe('SmbListComponent', () => {
  let spectator: Spectator<SmbListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: SmbListComponent,
    imports: [
      IxTable2Module,
      AppLoaderModule,
      AppCommonModule,
    ],
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
      ),
    ],
    providers: [
      mockProvider(AppLoaderService),
      mockProvider(ErrorHandlerService),
      mockProvider(EmptyService),
      mockProvider(AppLoaderService, {
        withLoader: jest.fn(() => pipe()),
      }),
      mockWebsocket([
        mockCall('sharing.smb.query', shares as SmbShare[]),
        mockCall('sharing.smb.delete'),
        mockCall('sharing.smb.update'),
        mockCall('cluster.utils.is_clustered', false),
        mockCall('pool.dataset.path_in_locked_datasets', false),
        mockCall('sharing.smb.getacl', { share_name: 'acl_share_name' } as SmbSharesec),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
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
    table = await loader.getHarness(IxTable2Harness);
    jest.spyOn(spectator.inject(Router), 'navigate').mockImplementation();
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('SMB');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmbFormComponent);
  });

  it('opens smb edit form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 4);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmbFormComponent, {
      data: shares[0],
    });
  });

  it('opens smb edit share ACL form when "Edit Share ACL" button is pressed', async () => {
    const editShareAclButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'share' }), 1, 4);
    await editShareAclButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmbAclComponent, {
      data: 'acl_share_name',
    });
  });

  it('redirects to edit ACL page when "Edit Filesystem ACL" button is pressed', async () => {
    const editFilesystemAclButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'security' }), 1, 4);
    await editFilesystemAclButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
      ['/', 'datasets', 'acl', 'edit'],
      { queryParams: { path: 'some-local-path' } },
    );
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 4);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('sharing.smb.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Path', 'Description', 'Enabled', ''],
      ['some-name', 'some-local-path', 'comment', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});

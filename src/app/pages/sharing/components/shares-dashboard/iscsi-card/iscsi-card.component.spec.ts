import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
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
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectServices } from 'app/store/services/services.selectors';

describe('IscsiCardComponent', () => {
  let spectator: Spectator<IscsiCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const iscsiShares = [
    {
      id: 6,
      name: 'grow',
      alias: 'kokok',
      mode: 'ISCSI',
      auth_networks: [],
      groups: [
        {
          portal: 1,
          initiator: 4,
          auth: null,
          authmethod: 'NONE',
        },
      ],
    },
  ] as IscsiTarget[];

  const createComponent = createComponentFactory({
    component: IscsiCardComponent,
    imports: [
      AppLoaderModule,
      IxTable2Module,
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
        mockCall('iscsi.target.query', iscsiShares),
        mockCall('iscsi.target.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(IxSlideInRef),
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
              service: ServiceName.Iscsi,
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
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Target Name', 'Target Alias', ''],
      ['grow', 'kokok', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing iSCSI Share when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 2);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(TargetFormComponent, {
      data: expect.objectContaining(iscsiShares[0]),
      wide: true,
    });
  });

  it('shows confirmation to delete iSCSI Share when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 2);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
  });

  it('checks user being redirected when pressed the Configure button', async () => {
    jest.spyOn(spectator.inject(Router), 'navigateByUrl');
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalled();
  });
});

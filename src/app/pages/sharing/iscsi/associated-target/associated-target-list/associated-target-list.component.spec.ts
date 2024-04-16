import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, pipe } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiExtent, IscsiTarget, IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/associated-target/associated-target-form/associated-target-form.component';
import { AssociatedTargetListComponent } from 'app/pages/sharing/iscsi/associated-target/associated-target-list/associated-target-list.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const targetExtents: IscsiTargetExtent[] = [
  {
    id: 1,
    target: 1,
    extent: 1,
    lunid: 0,
  },
];
const targets: IscsiTarget[] = [{
  id: 1,
  name: 'test-iscsi-target',
} as IscsiTarget];
const extents: IscsiExtent[] = [{
  id: 1,
  name: 'test-iscsi-extent',
} as IscsiExtent];

describe('AssociatedTargetListComponent', () => {
  let spectator: Spectator<AssociatedTargetListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: AssociatedTargetListComponent,
    imports: [
      IxTableModule,
      AppLoaderModule,
      SearchInput1Component,
    ],
    providers: [
      mockAuth(),
      mockProvider(AppLoaderService),
      mockProvider(ErrorHandlerService),
      mockProvider(EmptyService),
      mockProvider(AppLoaderService, {
        withLoader: jest.fn(() => pipe()),
      }),
      mockWebSocket([
        mockCall('iscsi.targetextent.query', targetExtents),
        mockCall('iscsi.targetextent.delete'),
        mockCall('iscsi.target.query', targets),
        mockCall('iscsi.extent.query', extents),
        mockCall('iscsi.global.sessions', []),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Associated Targets');
  });

  it('opens Associated Target form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AssociatedTargetFormComponent);
  });

  it('opens Associated Target form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AssociatedTargetFormComponent, {
      data: targetExtents[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 3);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.global.sessions');
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('iscsi.targetextent.delete', [1, true]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Target', 'LUN ID', 'Extent', ''],
      ['test-iscsi-target', '0', 'test-iscsi-extent', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});

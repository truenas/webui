import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { StaticRouteDeleteDialogComponent } from 'app/pages/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { StaticRoutesCardComponent } from 'app/pages/network/components/static-routes-card/static-routes-card.component';
import { SlideInService } from 'app/services/slide-in.service';

const staticRoutes = Array.from({ length: 10 }).map((val, index) => ({
  destination: `192.168.1.${index + 1}`,
  gateway: '192.168.1.1',
  description: `Test description for route ${index}`,
  id: index,
}));

describe('StaticRoutesCardComponent', () => {
  let spectator: Spectator<StaticRoutesCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: StaticRoutesCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('staticroute.query', staticRoutes),
        mockCall('staticroute.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(true),
        })),
      }),
      mockProvider(SlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Static Routes');
  });

  it('opens static route form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(StaticRouteFormComponent);
  });

  it('opens static route form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 2);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(StaticRouteFormComponent, {
      data: {
        description: 'Test description for route 0',
        destination: '192.168.1.1',
        gateway: '192.168.1.1',
        id: 0,
      },
    });
  });

  it('opens static route delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 2);
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StaticRouteDeleteDialogComponent, {
      data: {
        description: 'Test description for route 0',
        destination: '192.168.1.1',
        gateway: '192.168.1.1',
        id: 0,
      },
    });
  });
});

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { StaticRouteDeleteDialogComponent } from 'app/pages/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { StaticRoutesCardComponent } from 'app/pages/network/components/static-routes-card/static-routes-card.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const staticRoutes = Array.from({ length: 10 }).map((val, index) => ({
  destination: `192.168.1.${index + 1}`,
  gateway: '192.168.1.1',
  description: `Test description for route ${index}`,
  id: index,
}));

describe('StaticRoutesCardComponent', () => {
  let spectator: Spectator<StaticRoutesCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: StaticRoutesCardComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('staticroute.query', staticRoutes),
        mockCall('staticroute.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(IxSlideInService, {
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Static Routes');
  });

  it('opens static route form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(StaticRouteFormComponent);
  });

  it('opens static route form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(StaticRouteFormComponent, {
      data: {
        description: 'Test description for route 0',
        destination: '192.168.1.1',
        gateway: '192.168.1.1',
        id: 0,
      },
    });
  });

  it('opens static route delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
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

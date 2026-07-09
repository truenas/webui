import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnIconButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { StaticRouteDeleteDialog } from 'app/pages/system/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRoutesCardComponent } from 'app/pages/system/network/components/static-routes-card/static-routes-card.component';

const staticRoutes = Array.from({ length: 10 }).map((val, index) => ({
  destination: `192.168.1.${index + 1}`,
  gateway: '192.168.1.1',
  description: `Test description for route ${index}`,
  id: index,
}));

describe('StaticRoutesCardComponent', () => {
  let spectator: Spectator<StaticRoutesCardComponent>;
  let loader: HarnessLoader;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: StaticRoutesCardComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockApi([
        mockCall('staticroute.query', staticRoutes),
        mockCall('staticroute.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockAuth(),
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
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Add Static Route',
    });
  });

  it('opens static route form when "Edit" button is pressed', async () => {
    const [editButton] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Edit Static Route',
      editData: {
        description: 'Test description for route 0',
        destination: '192.168.1.1',
        gateway: '192.168.1.1',
        id: 0,
      },
    });
  });

  it('opens static route delete dialog when "Delete" button is pressed', async () => {
    const [deleteButton] = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-delete' }));
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(StaticRouteDeleteDialog, {
      data: {
        description: 'Test description for route 0',
        destination: '192.168.1.1',
        gateway: '192.168.1.1',
        id: 0,
      },
    });
  });
});

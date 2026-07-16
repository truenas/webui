import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCardComponent, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { TargetListComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';

const targets = [{
  id: 1,
  name: 'test-iscsi-target',
  alias: 'test-iscsi-target-alias',
  mode: IscsiTargetMode.Fc,
} as IscsiTarget];

describe('TargetListComponent', () => {
  let spectator: Spectator<TargetListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: TargetListComponent,
    providers: [
      mockProvider(EmptyService),
      mockApi([
        mockCall('iscsi.target.query', targets),
        mockCall('iscsi.target.delete'),
        mockCall('iscsi.global.sessions', []),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        dataProvider: new AsyncDataProvider(of(targets)),
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows accurate page title', () => {
    // White-box: no TnCardHarness in @truenas/ui-components yet.
    expect(spectator.query(TnCardComponent)!.title()).toBe('Targets');
  });

  it('opens target form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(TargetFormComponent, {
      title: 'Add ISCSI Target',
      wide: true,
    });
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Alias', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['test-iscsi-target', 'test-iscsi-target-alias', ''],
    ]);
  });

  it('should show extra Mode column when a non-iSCSI target exists', async () => {
    spectator.setInput('targets', targets);

    expect(await table.getHeaderTexts()).toEqual(['Name', 'Alias', 'Mode', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['test-iscsi-target', 'test-iscsi-target-alias', 'Fibre Channel', ''],
    ]);
  });
});

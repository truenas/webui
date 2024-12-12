import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TargetListComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { SlideInService } from 'app/services/slide-in.service';

const targets = [{
  id: 1,
  name: 'test-iscsi-target',
  alias: 'test-iscsi-target-alias',
  mode: IscsiTargetMode.Fc,
} as IscsiTarget];

describe('TargetListComponent', () => {
  let spectator: Spectator<TargetListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: TargetListComponent,
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockProvider(EmptyService),
      mockApi([
        mockCall('iscsi.target.query', targets),
        mockCall('iscsi.target.delete'),
        mockCall('iscsi.global.sessions', []),
      ]),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Targets');
  });

  it('opens target form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(TargetFormComponent, { wide: true });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Alias'],
      ['test-iscsi-target', 'test-iscsi-target-alias'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('should show extra Mode column', async () => {
    spectator.setInput('targets', targets);

    const expectedRows = [
      ['Name', 'Alias', 'Mode'],
      ['test-iscsi-target', 'test-iscsi-target-alias', 'Fibre Channel'],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});

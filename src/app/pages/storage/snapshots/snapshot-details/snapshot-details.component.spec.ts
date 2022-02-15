import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectorRef } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockComponent, MockPipe } from 'ng-mocks';
import { FileSizePipe } from 'ngx-filesize';
import { of } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { SnapshotDetailsComponent } from 'app/pages/storage/snapshots/snapshot-details/snapshot-details.component';
import { DialogService, ModalService } from 'app/services';
import { fakeSnapshotListRow } from '../testing/snapshot-fake-datasource';

describe('SnapshotDetailsComponent', () => {
  let spectator: Spectator<SnapshotDetailsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SnapshotDetailsComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    declarations: [
      MockComponent(IxTableComponent),
      MockPipe(FormatDateTimePipe, jest.fn(() => 'Jan 10 2022 10:36')),
      MockPipe(FileSizePipe, jest.fn(() => '1.49 TiB')),
    ],
    providers: [
      mockProvider(IxFormatterService),
      mockProvider(Store, {
        select: () => of('Europe/Kiev'),
      }),
      mockProvider(DialogService, {
        dialogForm: jest.fn(() => of(true)),
      }),
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => of(true)),
      }),
      mockProvider(IxTableComponent),
      mockProvider(ChangeDetectorRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.fixture.componentInstance.expandedRow = fakeSnapshotListRow;
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should emit delete event to parent component', async () => {
    // const table = await loader.getHarness();
    // expect(await table.getCells()).toEqual({});
    // TODO: Fix this
    jest.spyOn(spectator.component.actionPressed, 'emit').mockImplementation();

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'deleteDelete' }));
    await deleteButton.click();

    expect(spectator.component.actionPressed.emit).toHaveBeenCalledWith({ action: 'Delete', row: fakeSnapshotListRow });
  });
});

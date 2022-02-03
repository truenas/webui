import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectorRef } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent, MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';
import { SnapshotDetailsComponent } from 'app/pages/storage/snapshots/snapshot-table/components/snapshot-details/snapshot-details.component';
import { DialogService, ModalService } from 'app/services';

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
    ],
    providers: [
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  xit('should emit delete event to parent component', async () => {
    jest.spyOn(spectator.component.actionPressed, 'emit').mockImplementation();

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'deleteDelete' }));
    await deleteButton.click();

    const row = {} as SnapshotListRow;

    expect(spectator.component.actionPressed.emit).toHaveBeenCalledWith({ action: 'Delete', row });
  });
});

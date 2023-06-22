import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { DndModule } from 'ngx-drag-drop';
import { of } from 'rxjs';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TreeHarness } from 'app/modules/ix-tree/testing/tree.harness';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import {
  DiskIconComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-icon/disk-icon.component';
import {
  DiskInfoComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-info/disk-info.component';
import {
  ManualDiskSelectionFilters,
  ManualSelectionDiskFiltersComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import {
  ManualSelectionDisksComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component';
import {
  ManualDiskDragToggleStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

describe('ManualSelectionDisksComponent', () => {
  let spectator: Spectator<ManualSelectionDisksComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ManualSelectionDisksComponent,
    imports: [
      TreeModule,
      DndModule,
    ],
    declarations: [
      MockComponents(
        DiskInfoComponent,
        DiskIconComponent,
        ManualSelectionDiskFiltersComponent,
        IxIconComponent,
      ),
    ],
    providers: [
      mockProvider(ManualDiskDragToggleStore),
      mockProvider(ManualDiskSelectionStore, {
        inventory$: of([
          {
            name: 'sda',
            enclosure: {
              number: 1,
              slot: 1,
            },
          },
          {
            name: 'sdb',
          },
          {
            name: 'sdc',
          },
        ]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        enclosures: [
          {
            number: 1,
            label: 'Enclosure 1',
          },
        ] as Enclosure[],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of disks grouped by enclosure', async () => {
    expect(spectator.queryAll('.group-row-empty')).toHaveLength(0);

    const tree = await loader.getHarness(TreeHarness);
    const nodes = await tree.getNodes();

    expect(nodes).toHaveLength(2);
    expect(await nodes[0].getText()).toBe('1: Enclosure 1');
    expect(await nodes[1].getText()).toBe('No enclosure');

    await nodes[0].expand();

    const disks = spectator.queryAll('.unused-disk');
    expect(disks).toHaveLength(1);
  });

  it('updates disks shown when filters are updated', async () => {
    const filters = spectator.query(ManualSelectionDiskFiltersComponent);
    filters.filtersUpdated.emit({
      search: 'sdb',
    } as ManualDiskSelectionFilters);
    spectator.detectChanges();

    const emptyCategories = spectator.queryAll('.group-row-empty');
    expect(emptyCategories).toHaveLength(1);
    expect(emptyCategories[0]).toHaveText('1: Enclosure 1');

    const tree = await loader.getHarness(TreeHarness);
    const nodes = await tree.getNodes();
    await nodes[1].expand();

    const disks = spectator.queryAll('.unused-disk');
    expect(disks).toHaveLength(1);
  });
});

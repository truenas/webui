import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconComponent, TnTreeHarness } from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { DndModule } from 'ngx-drag-drop';
import { of } from 'rxjs';
import { settleDeferredTree } from 'app/core/testing/utils/settle-deferred-tree.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import {
  DiskIconComponent,
} from 'app/modules/disk-icon/disk-icon.component';
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
      DndModule,
      TnIconComponent,
    ],
    declarations: [
      MockComponents(
        DiskInfoComponent,
        DiskIconComponent,
        ManualSelectionDiskFiltersComponent,
      ),
    ],
    providers: [
      mockProvider(ManualDiskDragToggleStore),
      mockProvider(ManualDiskSelectionStore, {
        inventory$: of([
          {
            name: 'sda',
            sed_status: SedStatus.Unlocked,
            enclosure: {
              id: 'id1',
              drive_bay_number: 1,
            },
          },
          {
            name: 'sdb',
          },
          {
            name: 'sdc',
            sed_status: SedStatus.Uninitialized,
          },
        ] as DetailsDisk[]),
      }),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent({
      props: {
        enclosures: [
          {
            id: 'id1',
            label: 'Enclosure 1',
          },
        ] as Enclosure[],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  /**
   * Groups expand via a whole-row click (the built-in toggle is hidden).
   */
  async function expandGroup(index: number): Promise<void> {
    spectator.click(spectator.queryAll('.group-row')[index]);
    await settleDeferredTree(spectator.fixture);
  }

  /**
   * Collapsed children stay in the DOM CSS-hidden, and the harness has no
   * "visible descendants" query yet (requested upstream: a `visible` filter on
   * TnTreeHarness.getNodes) — fall back to the library's hiding class for the
   * one assertion where visibility across groups matters.
   */
  function visibleDisks(): Element[] {
    return spectator.queryAll('.unused-disk').filter((el) => !el.closest('.tn-tree-invisible'));
  }

  it('shows a list of disks grouped by enclosure', async () => {
    await settleDeferredTree(spectator.fixture);
    expect(spectator.queryAll('.group-row-empty')).toHaveLength(0);

    const tree = await loader.getHarness(TnTreeHarness);
    const nodes = await tree.getNodes({ level: 0 });

    expect(nodes).toHaveLength(2);
    expect(await nodes[0].getText()).toBe('Enclosure 1');
    expect(await nodes[1].getText()).toBe('No enclosure');

    expect(await nodes[0].isExpanded()).toBe(false);
    expect(await nodes[1].isExpanded()).toBe(false);
    await expandGroup(0);

    // Only the expanded enclosure's disk is revealed; the collapsed group's
    // disks remain in the DOM.
    expect(await nodes[0].isExpanded()).toBe(true);
    expect(visibleDisks()).toHaveLength(1);
  });

  it('updates disks shown when filters are updated', async () => {
    const filters = spectator.query(ManualSelectionDiskFiltersComponent)!;
    filters.filtersUpdated.emit({
      search: 'sdb',
    } as ManualDiskSelectionFilters);
    spectator.detectChanges();
    await settleDeferredTree(spectator.fixture);

    const emptyCategories = spectator.queryAll('.group-row-empty');
    expect(emptyCategories).toHaveLength(1);
    expect(emptyCategories[0]).toHaveText('Enclosure 1');

    await expandGroup(1);

    // Data-driven: the filter leaves a single disk in the tree.
    expect(spectator.queryAll('.unused-disk')).toHaveLength(1);
  });

  it('filters disks by SED Capable when sedCapable filter is enabled', async () => {
    const filters = spectator.query(ManualSelectionDiskFiltersComponent)!;
    filters.filtersUpdated.emit({
      sedCapable: true,
    } as ManualDiskSelectionFilters);
    spectator.detectChanges();
    await settleDeferredTree(spectator.fixture);

    await expandGroup(0);
    await expandGroup(1);

    // Data-driven: only sda and sdc (both SED capable) remain in the tree.
    expect(spectator.queryAll('.unused-disk')).toHaveLength(2);
  });
});

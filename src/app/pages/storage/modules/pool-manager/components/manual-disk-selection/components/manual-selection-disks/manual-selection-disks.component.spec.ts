import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconComponent, TnTreeHarness } from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { DndModule } from 'ngx-drag-drop';
import { of } from 'rxjs';
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
   * Child node insertion is deferred to a microtask by tn-nested-tree-node —
   * settle a few rounds so the whole tree is rendered.
   */
  async function settle(passes = 3): Promise<void> {
    for (let i = 0; i < passes; i++) {
      await spectator.fixture.whenStable();
      spectator.detectChanges();
    }
  }

  /**
   * Groups expand via a whole-row click (the built-in toggle is hidden), and
   * collapsed children stay in the DOM CSS-hidden — count only visible disks.
   */
  async function expandGroup(index: number): Promise<void> {
    spectator.click(spectator.queryAll('.group-row')[index]);
    await settle();
  }

  function visibleDisks(): Element[] {
    return spectator.queryAll('.unused-disk').filter((el) => !el.closest('.tn-tree-invisible'));
  }

  it('shows a list of disks grouped by enclosure', async () => {
    await settle();
    expect(spectator.queryAll('.group-row-empty')).toHaveLength(0);

    const tree = await loader.getHarness(TnTreeHarness);
    const nodes = await tree.getNodes({ level: 0 });

    expect(nodes).toHaveLength(2);
    expect(await nodes[0].getText()).toBe('Enclosure 1');
    expect(await nodes[1].getText()).toBe('No enclosure');

    expect(visibleDisks()).toHaveLength(0);
    await expandGroup(0);

    expect(visibleDisks()).toHaveLength(1);
  });

  it('updates disks shown when filters are updated', async () => {
    const filters = spectator.query(ManualSelectionDiskFiltersComponent)!;
    filters.filtersUpdated.emit({
      search: 'sdb',
    } as ManualDiskSelectionFilters);
    spectator.detectChanges();
    await settle();

    const emptyCategories = spectator.queryAll('.group-row-empty');
    expect(emptyCategories).toHaveLength(1);
    expect(emptyCategories[0]).toHaveText('Enclosure 1');

    await expandGroup(1);

    expect(visibleDisks()).toHaveLength(1);
  });

  it('filters disks by SED Capable when sedCapable filter is enabled', async () => {
    const filters = spectator.query(ManualSelectionDiskFiltersComponent)!;
    filters.filtersUpdated.emit({
      sedCapable: true,
    } as ManualDiskSelectionFilters);
    spectator.detectChanges();
    await settle();

    await expandGroup(0);
    await expandGroup(1);

    // Should show only sda and sdc (both SED capable)
    expect(visibleDisks()).toHaveLength(2);
  });
});

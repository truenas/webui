import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness } from '@truenas/ui-components';
import { MockComponents, MockPipe } from 'ng-mocks';
import { DndDropEvent } from 'ngx-drag-drop';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { WarningComponent } from 'app/modules/warning/warning.component';
import {
  EnclosureWrapperComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/enclosure-wrapper/enclosure-wrapper.component';
import {
  ManualSelectionVdevComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-vdev/manual-selection-vdev.component';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import {
  ManualDiskDragToggleStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

const disk = (name: string, size: number, enclosureId?: string): ManualSelectionDisk => ({
  name,
  size,
  enclosure: enclosureId ? { id: enclosureId, drive_bay_number: 1 } : {},
  vdevUuid: 'vdev1',
} as ManualSelectionDisk);

const vdev = (disks: ManualSelectionDisk[]): ManualSelectionVdev => ({ uuid: 'vdev1', disks });

describe('ManualSelectionVdevComponent', () => {
  let spectator: Spectator<ManualSelectionVdevComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ManualSelectionVdevComponent,
    declarations: [
      MockComponents(DiskIconComponent, EnclosureWrapperComponent, WarningComponent),
      MockPipe(FileSizePipe, (value: number) => buildNormalizedFileSize(value)),
    ],
    providers: [
      mockProvider(ManualDiskSelectionStore, {
        removeVdev: jest.fn(),
        addDiskToVdev: jest.fn(),
        removeDiskFromVdev: jest.fn(),
      }),
      mockProvider(ManualDiskDragToggleStore, {
        dragActive$: of(false),
        toggleActivateDrag: jest.fn(),
      }),
    ],
  });

  function setup(props: Partial<ManualSelectionVdevComponent> | Record<string, unknown>): void {
    spectator = createComponent({
      props: {
        layout: CreateVdevLayout.Mirror,
        position: 1,
        enclosures: [{ id: 'enc1' }, { id: 'enc2' }] as Enclosure[],
        ...props,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows the layout and an estimate of usable capacity once the vdev has enough disks', () => {
    setup({ vdev: vdev([disk('sda', GiB), disk('sdb', GiB)]) });

    expect(spectator.query('h3')).toHaveText('MIRROR');
    expect(spectator.query('.type-container p')).toHaveText('1 GiB Est. Usable Raw Capacity');
    expect(spectator.query('.error')).not.toExist();
  });

  it('asks for more disks and reports the minimum when the vdev is short of its layout', () => {
    setup({
      layout: CreateVdevLayout.Raidz1,
      vdev: vdev([disk('sda', GiB), disk('sdb', GiB)]),
    });

    expect(spectator.query('.type-container p')).toHaveText('Add the required no. of disks to get a vdev size estimate');
    expect(spectator.query('.error')).toHaveText('At least 3 disk(s) are required for Raidz1 vdevs');
  });

  it('warns when disks of different sizes are mixed in one vdev', () => {
    setup({ vdev: vdev([disk('sda', GiB), disk('sdb', 2 * GiB)]) });

    expect(spectator.query('.error')).toHaveText('Mixing disks of different sizes in a vdev is not recommended.');
  });

  it('does not treat disks within 10 MiB of each other as different sizes', () => {
    setup({ vdev: vdev([disk('sda', GiB), disk('sdb', GiB + 1024)]) });

    expect(spectator.query('.error')).not.toExist();
  });

  it('groups disks by enclosure and warns when the vdev spans enclosures', () => {
    setup({
      vdev: vdev([disk('sda', GiB, 'enc1'), disk('sdb', GiB, 'enc1'), disk('sdc', GiB, 'enc2')]),
    });

    const wrappers = spectator.queryAll(EnclosureWrapperComponent);
    expect(wrappers).toHaveLength(2);
    expect(wrappers.map((wrapper) => wrapper.enclosure)).toEqual([{ id: 'enc1' }, { id: 'enc2' }]);
    expect(spectator.queryAll(DiskIconComponent).map((icon) => icon.name)).toEqual(['sda', 'sdb', 'sdc']);
    expect(spectator.query(WarningComponent)!.message).toBe('VDEVs span enclosures');
  });

  it('warns when some disks are in an enclosure and others are not', () => {
    setup({ vdev: vdev([disk('sda', GiB, 'enc1'), disk('sdb', GiB)]) });

    expect(spectator.queryAll(EnclosureWrapperComponent)).toHaveLength(1);
    expect(spectator.queryAll('.no-enclosure ix-disk-icon')).toHaveLength(1);
    expect(spectator.query(WarningComponent)).toExist();
  });

  it('does not warn when every disk sits in the same enclosure', () => {
    setup({ vdev: vdev([disk('sda', GiB, 'enc1'), disk('sdb', GiB, 'enc1')]) });

    expect(spectator.query(WarningComponent)).not.toExist();
  });

  it('recomputes the estimate and warnings when the vdev input changes', () => {
    setup({ layout: CreateVdevLayout.Raidz1, vdev: vdev([disk('sda', GiB)]) });
    expect(spectator.query('.error')).toExist();

    spectator.setInput('vdev', vdev([disk('sda', GiB), disk('sdb', GiB), disk('sdc', GiB)]));

    expect(spectator.query('.error')).not.toExist();
    expect(spectator.query('.type-container p')).toHaveText('2 GiB Est. Usable Raw Capacity');
  });

  it('lets the user delete an editable vdev', async () => {
    const currentVdev = vdev([disk('sda', GiB), disk('sdb', GiB)]);
    setup({ vdev: currentVdev, editable: true });

    expect(spectator.query('.drag-hint')).toExist();

    const deleteButton = await loader.getHarness(TnIconButtonHarness);
    await deleteButton.click();

    expect(spectator.inject(ManualDiskSelectionStore).removeVdev).toHaveBeenCalledWith(currentVdev);
  });

  it('does not offer delete or drag hints on a read-only vdev', async () => {
    setup({ vdev: vdev([disk('sda', GiB), disk('sdb', GiB)]) });

    expect(spectator.query('.drag-hint')).not.toExist();
    expect(await loader.getAllHarnesses(TnIconButtonHarness)).toHaveLength(0);
  });

  it('moves a disk dropped from another vdev into this one', () => {
    const currentVdev = vdev([disk('sda', GiB)]);
    setup({ vdev: currentVdev, editable: true });
    const droppedDisk = { ...disk('sdz', GiB), vdevUuid: 'other-vdev' };

    spectator.triggerEventHandler('.drag-container', 'dndDrop', { data: droppedDisk } as DndDropEvent);

    const store = spectator.inject(ManualDiskSelectionStore);
    expect(store.removeDiskFromVdev).toHaveBeenCalledWith(droppedDisk);
    expect(store.addDiskToVdev).toHaveBeenCalledWith({ disk: droppedDisk, vdev: currentVdev });
    expect(spectator.inject(ManualDiskDragToggleStore).toggleActivateDrag).toHaveBeenCalledWith(false);
  });

  it('adds an unassigned dropped disk without removing it from anywhere', () => {
    setup({ vdev: vdev([disk('sda', GiB)]), editable: true });
    const droppedDisk = { ...disk('sdz', GiB), vdevUuid: null };

    spectator.triggerEventHandler('.drag-container', 'dndDrop', { data: droppedDisk } as DndDropEvent);

    const store = spectator.inject(ManualDiskSelectionStore);
    expect(store.removeDiskFromVdev).not.toHaveBeenCalled();
    expect(store.addDiskToVdev).toHaveBeenCalled();
  });

  it('marks a disk as being dragged out of this vdev', () => {
    setup({ vdev: vdev([disk('sda', GiB)]), editable: true });
    const dragStore = spectator.inject(ManualDiskDragToggleStore);

    spectator.triggerEventHandler('.no-enclosure ix-disk-icon', 'dndStart', new Event('dragstart'));
    expect(dragStore.toggleActivateDrag).toHaveBeenLastCalledWith(true);

    spectator.triggerEventHandler('.no-enclosure ix-disk-icon', 'dndEnd', new Event('dragend'));
    expect(dragStore.toggleActivateDrag).toHaveBeenLastCalledWith(false);

    spectator.triggerEventHandler('.no-enclosure ix-disk-icon', 'dndCanceled', new Event('dragend'));
    expect(dragStore.toggleActivateDrag).toHaveBeenCalledTimes(3);
  });
});

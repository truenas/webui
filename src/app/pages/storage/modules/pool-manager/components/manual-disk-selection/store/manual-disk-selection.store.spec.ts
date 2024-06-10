import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { UUID } from 'angular2-uuid';
import { TestScheduler } from 'rxjs/testing';
import { TiB } from 'app/constants/bytes.constant';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

describe('ManualDiskSelectionStore', () => {
  let spectator: SpectatorService<ManualDiskSelectionStore>;
  let testScheduler: TestScheduler;

  const unusedDisks: DetailsDisk[] = [
    {
      identifier: '{serial_lunid} 8HG7MZJH_5000cca2700de678',
      name: 'sdo',
      serial: '8HG7MZJH',
      size: 12 * TiB,
      model: 'HUH721212AL4200',
      type: DiskType.Hdd,
      enclosure: {
        id: 'id0',
        drive_bay_number: 1,
      },
    } as DetailsDisk,
    {
      identifier: '{serial_lunid} 8HG7MZJH_5000cca2700de679',
      name: 'sdp',
      serial: '8HG7MZJI',
      size: 12 * TiB,
      model: 'HUH721212AL4201',
      type: DiskType.Hdd,
      enclosure: {
        id: 'id0',
        drive_bay_number: 2,
      },
    } as DetailsDisk,
  ];

  const createService = createServiceFactory({
    service: ManualDiskSelectionStore,
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initialize({
      layout: CreateVdevLayout.Stripe,
      vdevs: [],
      inventory: [
        ...unusedDisks,
      ],
    });
    testScheduler = getTestScheduler();
  });

  it('adds a new vdev', () => {
    jest.spyOn(UUID, 'UUID')
      .mockReturnValueOnce('first_vdev');
    spectator.service.addVdev();
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.vdevs$).toBe('a', {
        a: [{
          disks: [],
          uuid: 'first_vdev',
        }],
      });
    });
  });

  it('adds disks to vdev', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.addDiskToVdev({
        disk: unusedDisks[0],
        vdev: {
          disks: [],
          uuid: 'first_vdev',
        },
      });
      spectator.service.addDiskToVdev({
        disk: unusedDisks[1],
        vdev: {
          disks: [],
          uuid: 'first_vdev',
        },
      });
      expectObservable(spectator.service.vdevs$).toBe('a', {
        a: [{
          disks: [{
            ...unusedDisks[0],
            vdevUuid: 'first_vdev',
          }, {
            ...unusedDisks[1],
            vdevUuid: 'first_vdev',
          }],
          uuid: 'first_vdev',
        }],
      });
    });
  });

  it('removes disk from vdev', () => {
    spectator.service.addDiskToVdev({
      disk: unusedDisks[0],
      vdev: {
        disks: [],
        uuid: 'first_vdev',
      },
    });
    spectator.service.addDiskToVdev({
      disk: unusedDisks[1],
      vdev: {
        disks: [],
        uuid: 'first_vdev',
      },
    });

    spectator.service.removeDiskFromVdev({
      ...unusedDisks[0],
      vdevUuid: 'first_vdev',
    });

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.vdevs$).toBe('a', {
        a: [{
          disks: [{
            ...unusedDisks[1],
            vdevUuid: 'first_vdev',
          }],
          uuid: 'first_vdev',
        }],
      });
    });
  });

  it('removes vdev', () => {
    spectator.service.removeVdev({
      disks: [],
      uuid: 'first_vdev',
    });
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.vdevs$).toBe('a', {
        a: [],
      });
    });
  });
});

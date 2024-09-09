import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { generateVdevDisks, expectDisks, categorySequence } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/test-utils';

describe('GenerateVdevsService - maximize dispersal', () => {
  let spectator: SpectatorService<GenerateVdevsService>;
  const createService = createServiceFactory(GenerateVdevsService);

  beforeEach(() => spectator = createService());

  it('one wide category', () => {
    const vdevs = spectator.service.generateVdevs({
      allowedDisks: generateVdevDisks,
      topology: {
        [VdevType.Data]: {
          diskSize: 5 * GiB,
          width: 5,
          vdevsNumber: 1,
          diskType: DiskType.Hdd,
          layout: CreateVdevLayout.Stripe,
        },
      } as PoolManagerTopology,
      maximizeDispersal: true,
      categorySequence,
    });

    expect(vdevs).toEqual({
      [VdevType.Data]: expectDisks([
        ['enclosure1-disk1', 'enclosure2-disk1', 'enclosure3-disk1', 'no-enclosure-disk1', 'enclosure1-disk2'],
      ]),
    });
  });

  it('many small vdevs in one category', () => {
    const vdevs = spectator.service.generateVdevs({
      allowedDisks: generateVdevDisks,
      topology: {
        [VdevType.Data]: {
          diskSize: 5 * GiB,
          width: 2,
          vdevsNumber: 5,
          diskType: DiskType.Hdd,
          layout: CreateVdevLayout.Stripe,
        },
      } as PoolManagerTopology,
      maximizeDispersal: true,
      categorySequence,
    });

    expect(vdevs).toEqual({
      [VdevType.Data]: expectDisks([
        ['enclosure1-disk1', 'enclosure2-disk1'],
        ['enclosure3-disk1', 'no-enclosure-disk1'],
        ['enclosure1-disk2', 'enclosure2-disk2'],
        ['enclosure3-disk2', 'enclosure1-disk3'],
        ['enclosure3-disk3', 'enclosure3-disk4'],
      ]),
    });
  });

  it('multiple categories with same disk size and type', () => {
    const vdevs = spectator.service.generateVdevs({
      allowedDisks: generateVdevDisks,
      topology: {
        [VdevType.Data]: {
          diskSize: 5 * GiB,
          width: 3,
          vdevsNumber: 1,
          diskType: DiskType.Hdd,
          layout: CreateVdevLayout.Stripe,
        },
        [VdevType.Special]: {
          diskSize: 5 * GiB,
          width: 2,
          vdevsNumber: 2,
          diskType: DiskType.Hdd,
          layout: CreateVdevLayout.Stripe,
        },
      } as PoolManagerTopology,
      maximizeDispersal: true,
      categorySequence,
    });

    expect(vdevs).toEqual({
      [VdevType.Data]: expectDisks([
        ['enclosure1-disk1', 'enclosure2-disk1', 'enclosure3-disk1'],
      ]),
      [VdevType.Special]: expectDisks([
        ['no-enclosure-disk1', 'enclosure1-disk2'],
        ['enclosure2-disk2', 'enclosure3-disk2'],
      ]),
    });
  });

  it('multiple categories with different disk sizes and types', () => {
    const vdevs = spectator.service.generateVdevs({
      allowedDisks: generateVdevDisks,
      topology: {
        [VdevType.Data]: {
          diskSize: 5 * GiB,
          width: 3,
          vdevsNumber: 1,
          diskType: DiskType.Hdd,
          layout: CreateVdevLayout.Stripe,
        },
        [VdevType.Log]: {
          diskSize: 2 * GiB,
          width: 1,
          vdevsNumber: 2,
          diskType: DiskType.Ssd,
          layout: CreateVdevLayout.Stripe,
        },
        [VdevType.Special]: {
          diskSize: 5 * GiB,
          width: 2,
          vdevsNumber: 2,
          diskType: DiskType.Hdd,
          layout: CreateVdevLayout.Stripe,
        },
      } as PoolManagerTopology,
      maximizeDispersal: true,
      categorySequence,
    });

    expect(vdevs).toEqual({
      [VdevType.Data]: expectDisks([
        ['enclosure1-disk1', 'enclosure2-disk1', 'enclosure3-disk1'],
      ]),
      [VdevType.Log]: expectDisks([
        ['small-ssd1'],
        ['small-ssd2'],
      ]),
      [VdevType.Special]: expectDisks([
        ['no-enclosure-disk1', 'enclosure1-disk2'],
        ['enclosure2-disk2', 'enclosure3-disk2'],
      ]),
    });
  });
});

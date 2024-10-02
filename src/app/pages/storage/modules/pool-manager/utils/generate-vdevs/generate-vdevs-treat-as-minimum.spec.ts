import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { generateVdevDisks, expectDisks, categorySequence } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/test-utils';

describe('GenerateVdevsService - treat disk size as minimum', () => {
  let spectator: SpectatorService<GenerateVdevsService>;
  const createService = createServiceFactory(GenerateVdevsService);

  beforeEach(() => spectator = createService());

  describe('without dispersal', () => {
    it('multiple categories', () => {
      const vdevs = spectator.service.generateVdevs({
        allowedDisks: generateVdevDisks,
        topology: {
          [VdevType.Data]: {
            diskSize: 5 * GiB,
            width: 2,
            vdevsNumber: 3,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
          [VdevType.Log]: {
            diskSize: 5 * GiB,
            width: 3,
            vdevsNumber: 2,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
          [VdevType.Spare]: {
            diskSize: 5 * GiB,
            width: 1,
            vdevsNumber: 2,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
        } as PoolManagerTopology,
        maximizeDispersal: false,
        categorySequence,
      });

      expect(vdevs).toEqual({
        [VdevType.Data]: expectDisks([
          ['enclosure1-disk1', 'enclosure1-disk2'],
          ['enclosure1-disk3', 'enclosure2-disk1'],
          ['enclosure2-disk2', 'enclosure3-disk1'],
        ]),
        [VdevType.Log]: expectDisks([
          ['enclosure3-disk2', 'enclosure3-disk3', 'enclosure3-disk4'],
          ['enclosure3-disk5', 'no-enclosure-disk1', 'larger1'],
        ]),
        [VdevType.Spare]: expectDisks([['larger2'], ['larger3']]),
      });
    });

    it('mixing disk types/sizes and treatDiskSizeAsMinimum settings', () => {
      const vdevs = spectator.service.generateVdevs({
        allowedDisks: generateVdevDisks,
        topology: {
          [VdevType.Data]: {
            diskSize: 3 * GiB,
            width: 3,
            vdevsNumber: 1,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
          [VdevType.Log]: {
            diskSize: GiB,
            width: 1,
            vdevsNumber: 1,
            diskType: DiskType.Ssd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
          [VdevType.Spare]: {
            diskSize: 2 * GiB,
            width: 1,
            vdevsNumber: 1,
            diskType: DiskType.Ssd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: false,
          },
        } as PoolManagerTopology,
        maximizeDispersal: false,
        categorySequence,
      });

      expect(vdevs).toEqual({
        [VdevType.Data]: expectDisks([['enclosure1-disk1', 'enclosure1-disk2', 'enclosure1-disk3']]),
        [VdevType.Log]: expectDisks([['small-ssd1']]),
        [VdevType.Spare]: expectDisks([['small-ssd2']]),
      });
    });
  });

  describe('with dispersal', () => {
    it('multiple categories', () => {
      const vdevs = spectator.service.generateVdevs({
        allowedDisks: generateVdevDisks,
        topology: {
          [VdevType.Data]: {
            diskSize: 5 * GiB,
            width: 2,
            vdevsNumber: 3,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
          [VdevType.Log]: {
            diskSize: 5 * GiB,
            width: 3,
            vdevsNumber: 2,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
          [VdevType.Spare]: {
            diskSize: 5 * GiB,
            width: 1,
            vdevsNumber: 2,
            diskType: DiskType.Hdd,
            layout: CreateVdevLayout.Stripe,
            treatDiskSizeAsMinimum: true,
          },
        } as PoolManagerTopology,
        maximizeDispersal: true,
        categorySequence,
      });

      expect(vdevs).toEqual({
        [VdevType.Data]: expectDisks([
          ['enclosure1-disk1', 'enclosure2-disk1'],
          ['enclosure3-disk1', 'larger1'],
          ['no-enclosure-disk1', 'enclosure1-disk2'],
        ]),
        [VdevType.Log]: expectDisks([
          ['enclosure2-disk2', 'enclosure3-disk2', 'larger2'],
          ['enclosure1-disk3', 'enclosure3-disk3', 'larger3'],
        ]),
        [VdevType.Spare]: expectDisks([['enclosure3-disk4'], ['enclosure3-disk5']]),
      });
    });
  });
});

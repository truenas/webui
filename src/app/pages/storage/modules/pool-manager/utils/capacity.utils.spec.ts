import { GiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { categoryCapacity, vdevCapacity } from 'app/pages/storage/modules/pool-manager/utils/capacity.utils';

describe('categoryCapacity', () => {
  it('returns the sum of all disks in a category', () => {
    const category = {
      layout: CreateVdevLayout.Stripe,
      vdevs: [
        [{ size: 3 * GiB }, { size: 5 * GiB }],
        [{ size: 3 * GiB }],
      ],
    } as PoolManagerTopologyCategory;

    expect(categoryCapacity(category, 2 * GiB)).toEqual(5 * GiB);
  });
});

describe('vdevCapacity', () => {
  const vdev = [
    { size: 3 * GiB },
    { size: 5 * GiB },
    { size: 5 * GiB },
    { size: 7 * GiB },
    { size: 6 * GiB },
  ] as UnusedDisk[];

  it('stripe layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Stripe,
      swapOnDrive: 2 * GiB,
    })).toEqual(16 * GiB);
  });

  it('mirror layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Mirror,
      swapOnDrive: 2 * GiB,
    })).toEqual(GiB);
  });

  it('raidz1 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Raidz1,
      swapOnDrive: 2 * GiB,
    })).toEqual(4 * GiB);
  });

  it('raidz2 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Raidz2,
      swapOnDrive: 2 * GiB,
    })).toEqual(3 * GiB);
  });

  it('raidz3 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Raidz3,
      swapOnDrive: 2 * GiB,
    })).toEqual(2 * GiB);
  });

  it('draid1 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Draid1,
      swapOnDrive: 2 * GiB,
      draidDataDisks: 2,
      draidSpareDisks: 1,
    }) / GiB).toBeCloseTo(2.67);
  });

  it('draid2 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Draid2,
      swapOnDrive: 2 * GiB,
      draidDataDisks: 2,
      draidSpareDisks: 1,
    }) / GiB).toBeCloseTo(2);
  });

  it('draid3 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Draid3,
      swapOnDrive: 2 * GiB,
      draidDataDisks: 2,
      draidSpareDisks: 1,
    }) / GiB).toBeCloseTo(1.6);
  });
});

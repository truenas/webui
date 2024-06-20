import { GiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
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

    expect(categoryCapacity(category)).toEqual(11 * GiB);
  });
});

describe('vdevCapacity', () => {
  const vdev = [
    { size: 3 * GiB },
    { size: 5 * GiB },
    { size: 5 * GiB },
    { size: 7 * GiB },
    { size: 6 * GiB },
  ] as DetailsDisk[];

  it('stripe layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Stripe,
    })).toEqual(26 * GiB);
  });

  it('mirror layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Mirror,
    })).toEqual(3 * GiB);
  });

  it('raidz1 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Raidz1,
    })).toEqual(12 * GiB);
  });

  it('raidz2 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Raidz2,
    })).toEqual(9 * GiB);
  });

  it('raidz3 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Raidz3,
    })).toEqual(6 * GiB);
  });

  it('draid1 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Draid1,
      draidDataDisks: 2,
      draidSpareDisks: 1,
    }) / GiB).toBeCloseTo(8);
  });

  it('draid2 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Draid2,
      draidDataDisks: 2,
      draidSpareDisks: 1,
    }) / GiB).toBeCloseTo(6);
  });

  it('draid3 layout', () => {
    expect(vdevCapacity({
      vdev,
      layout: CreateVdevLayout.Draid3,
      draidDataDisks: 2,
      draidSpareDisks: 1,
    }) / GiB).toBeCloseTo(4.8);
  });
});

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('TopologyCategoryDescriptionPipe', () => {
  let spectator: SpectatorService<TopologyCategoryDescriptionPipe>;
  const createPipe = createServiceFactory({
    service: TopologyCategoryDescriptionPipe,
  });

  beforeEach(() => {
    spectator = createPipe();
  });

  it('returns None when there are no vdevs in topology category', () => {
    expect(spectator.service.transform({
      vdevs: [] as DetailsDisk[][],
    } as PoolManagerTopologyCategory)).toBe('None');
  });

  it('returns Manual Layout when manual layout is used', () => {
    expect(spectator.service.transform({
      vdevs: [{}],
      hasCustomDiskSelection: true,
    } as PoolManagerTopologyCategory)).toBe('Manual layout | 1 VDEVs');
  });

  it('returns a string describing vdevs when automatic form is used', () => {
    expect(spectator.service.transform({
      diskSize: 2 * GiB,
      vdevsNumber: 2,
      layout: CreateVdevLayout.Stripe,
      width: 3,
      diskType: DiskType.Hdd,
      vdevs: [[{}], [{}]],
    } as PoolManagerTopologyCategory)).toBe('2 × STRIPE | 3 × 2 GiB (HDD)');
  });

  it('returns a string describing Typology which has layout limit', () => {
    expect(spectator.service.transform({
      diskSize: 2 * GiB,
      vdevsNumber: 2,
      layout: CreateVdevLayout.Stripe,
      width: 3,
      diskType: DiskType.Hdd,
      vdevs: [[{}], [{}]],
    } as PoolManagerTopologyCategory, false)).toBe('3 × 2 GiB (HDD)');
  });
});

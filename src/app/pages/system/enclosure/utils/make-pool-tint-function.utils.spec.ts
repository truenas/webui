import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import { makePoolTintFunction } from 'app/pages/system/enclosure/utils/make-pool-tint-function.utils';
import { unassignedColor } from 'app/pages/system/enclosure/utils/unassigned-color.const';

describe('makePoolTintFunction – returns a function and', () => {
  let poolTint: TintingFunction;

  beforeEach(() => {
    poolTint = makePoolTintFunction({
      pool1: 'red',
      pool2: 'blue',
    });
  });

  it('returns null when slot is empty', () => {
    expect(poolTint({} as DashboardEnclosureSlot)).toBeNull();
  });

  it('returns unassignedColor when disk is not part of the pool', () => {
    expect(poolTint({ dev: 'sda' } as DashboardEnclosureSlot)).toBe(unassignedColor);
  });

  it('returns color of an associated pool', () => {
    expect(poolTint({
      dev: 'sda',
      pool_info: {
        pool_name: 'pool1',
      },
    } as DashboardEnclosureSlot)).toBe('red');
  });
});

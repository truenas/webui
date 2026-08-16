import { getPoolCapacityLevel } from 'app/constants/pool-capacity.constant';
import { PoolCapacityLevel } from 'app/enums/pool-capacity-level.enum';

describe('getPoolCapacityLevel', () => {
  it('treats usage below 80% as safe', () => {
    expect(getPoolCapacityLevel(0)).toBe(PoolCapacityLevel.Safe);
    expect(getPoolCapacityLevel(79.99)).toBe(PoolCapacityLevel.Safe);
  });

  it('treats usage from 80% up to 90% as a warning', () => {
    expect(getPoolCapacityLevel(80)).toBe(PoolCapacityLevel.Warning);
    expect(getPoolCapacityLevel(83.9)).toBe(PoolCapacityLevel.Warning);
    expect(getPoolCapacityLevel(89.99)).toBe(PoolCapacityLevel.Warning);
  });

  it('treats usage from 90% as critical', () => {
    expect(getPoolCapacityLevel(90)).toBe(PoolCapacityLevel.Critical);
    expect(getPoolCapacityLevel(100)).toBe(PoolCapacityLevel.Critical);
  });
});

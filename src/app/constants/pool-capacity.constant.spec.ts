import {
  getPoolCapacityGaugeFill, getPoolCapacityGaugeLabelStyle, getPoolCapacityLevel,
} from 'app/constants/pool-capacity.constant';
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

describe('getPoolCapacityGaugeFill', () => {
  const colors = {
    blank: 'blank', fill: 'fill', warning: 'warning', critical: 'critical',
  };

  it('returns the blank color when nothing is used', () => {
    expect(getPoolCapacityGaugeFill(0, colors)).toBe('blank');
  });

  it('returns a color matching the capacity level', () => {
    expect(getPoolCapacityGaugeFill(79.99, colors)).toBe('fill');
    expect(getPoolCapacityGaugeFill(80, colors)).toBe('warning');
    expect(getPoolCapacityGaugeFill(90, colors)).toBe('critical');
  });
});

describe('getPoolCapacityGaugeLabelStyle', () => {
  it('tints the label to match the capacity level', () => {
    expect(getPoolCapacityGaugeLabelStyle(79.99)).toBe('');
    expect(getPoolCapacityGaugeLabelStyle(80)).toBe('color: var(--orange);');
    expect(getPoolCapacityGaugeLabelStyle(90)).toBe('color: var(--red);');
  });
});

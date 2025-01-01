import { prepareBwlimit } from './bwlimit.utils';

describe('prepareBwlimit', () => {
  it('should return an empty array if bwlimit is undefined', () => {
    const result = prepareBwlimit(undefined);
    expect(result).toEqual([]);
  });

  it('should return an empty array if bwlimit is an empty array', () => {
    const bwlimit: string[] = [];
    const result = prepareBwlimit(bwlimit);
    expect(result).toEqual([]);
  });

  it('should add default time if bwlimit has only one limit without time', () => {
    const bwlimit: string[] = ['100'];
    const result = prepareBwlimit(bwlimit);
    expect(result).toEqual([{ time: '00:00', bandwidth: '100' }]);
  });

  it('should convert bandwidth to bytes if it ends with "/s"', () => {
    const bwlimit: string[] = ['10M'];
    const result = prepareBwlimit(bwlimit);
    expect(result).toEqual([{ time: '00:00', bandwidth: '10485760' }]);
  });

  it('should convert bandwidth to bytes if it ends with "/S"', () => {
    const bwlimit: string[] = ['10MB/S'];
    const result = prepareBwlimit(bwlimit);
    expect(result).toEqual([{ time: '00:00', bandwidth: '10485760' }]);
  });

  it('should return null bandwidth if it is "off"', () => {
    const bwlimit: string[] = ['00:00, off'];
    const result = prepareBwlimit(bwlimit);
    expect(result).toEqual([{ time: '00:00', bandwidth: null }]);
  });

  it('should return an array of BwLimitUpdate objects', () => {
    const bwlimit: string[] = ['00:00, 10MB/s', '12:00, 5GB/s'];
    const result = prepareBwlimit(bwlimit);
    expect(result).toEqual([
      { time: '00:00', bandwidth: '10485760' },
      { time: '12:00', bandwidth: '5368709120' },
    ]);
  });
});

import { extractVersion } from './extract-version';

describe('extractVersion', () => {
  it('should extract the version "24.10" from "TrueNAS-SCALE-24.10.0-MASTER-20240324-065034"', () => {
    const result = extractVersion('TrueNAS-SCALE-24.10.0-MASTER-20240324-065034');
    expect(result).toBe('24.10');
  });

  it('should extract the version "24.10" from "24.10-BETA.1-INTERNAL.7"', () => {
    const result = extractVersion('24.10-BETA.1-INTERNAL.7');
    expect(result).toBe('24.10');
  });

  it('should return undefined for a string with no matching version pattern', () => {
    const result = extractVersion('NoVersionHere');
    expect(result).toBeUndefined();
  });

  it('should extract the version "1.2" from "1.2.3-alpha"', () => {
    const result = extractVersion('1.2.3-alpha');
    expect(result).toBe('1.2');
  });

  it('should extract the version "10.20" from "v10.20.30-beta-release"', () => {
    const result = extractVersion('v10.20.30-beta-release');
    expect(result).toBe('10.20');
  });

  it('should extract the version "0.1" from "v0.1.0-RC1"', () => {
    const result = extractVersion('v0.1.0-RC1');
    expect(result).toBe('0.1');
  });

  it('should return undefined for a string "Version-1-2-3"', () => {
    const result = extractVersion('Version-1-2-3');
    expect(result).toBeUndefined();
  });

  it('should extract the version "2.5" from "2.5-rc.1-build.2023"', () => {
    const result = extractVersion('2.5-rc.1-build.2023');
    expect(result).toBe('2.5');
  });
});

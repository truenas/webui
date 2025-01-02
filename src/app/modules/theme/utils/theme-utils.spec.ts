import { ThemeUtils } from 'app/modules/theme/utils/theme-utils';

describe('ThemeUtils', () => {
  const utils = new ThemeUtils();

  it('should detect value types', () => {
    const hex = '#ffffff';
    const rgb = 'rgb(0,0,0)';
    const rgba = 'rgba(0,0,0,0)';
    const cssVar = 'var(--something)';

    expect(utils.getValueType(hex)).toBe('hex');
    expect(utils.getValueType(rgb)).toBe('rgb');
    expect(utils.getValueType(rgba)).toBe('rgba');
    expect(utils.getValueType(cssVar)).toBe('cssVar');
    expect(utils.getValueType('asdasd')).toBe('unknown');
  });
});

import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';

describe('ThemeUtils', () => {
  let utils: ThemeUtils;

  beforeEach(() => {
    utils = new ThemeUtils();
  });

  // Detect Value Type
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

  // Convert Hex to RGB
  it('should convert hex color strings to RGB color strings', () => {
    const white = '#ffffff';
    const red = '#ff0000';
    const green = '#00ff00';
    const blue = '#0000ff';

    const whiteRgb = utils.hexToRgb(white);
    expect(whiteRgb.rgb).toStrictEqual([255, 255, 255]);

    const redRgb = utils.hexToRgb(red);
    expect(redRgb.rgb).toStrictEqual([255, 0, 0]);

    const greenRgb = utils.hexToRgb(green);
    expect(greenRgb.rgb).toStrictEqual([0, 255, 0]);

    const blueRgb = utils.hexToRgb(blue);
    expect(blueRgb.rgb).toStrictEqual([0, 0, 255]);
  });

  // Convert RGB to Hex
  it('should convert RGB color strings to hex strings', () => {
    expect(utils).toBeTruthy();
    const whiteRgb = 'rgb(255,255,255)';
    const redRgb = 'rgb(255,0,0)';
    const greenRgb = 'rgb(0,255,0)';
    const blueRgb = 'rgb(0,0,255)';

    const white = utils.rgbToHex(whiteRgb);
    expect(white).toBe('#ffffff');

    const red = utils.rgbToHex(redRgb);
    expect(red).toBe('#ff0000');

    const green = utils.rgbToHex(greenRgb);
    expect(green).toBe('#00ff00');

    const blue = utils.rgbToHex(blueRgb);
    expect(blue).toBe('#0000ff');
  });

  // Convert RGB to HSL
  it('should convert RGB color strings to HSL color strings', () => {
    /*
     * HSL (Hue, Saturation, Level)
     * Values are Degrees, percent, percent
     * */

    const redRgb = 'rgb(255,0,0)';
    const red = utils.rgbToHsl(redRgb, true, true);
    expect(red).toBe('hsl(0, 100%, 50%)');

    const greenRgb = 'rgb(0,255,0)';
    const green = utils.rgbToHsl(greenRgb, true, true);
    expect(green).toBe('hsl(120, 100%, 50%)');

    const blueRgb = 'rgb(0,0,255)';
    const blue = utils.rgbToHsl(blueRgb, true, true);
    expect(blue).toBe('hsl(240, 100%, 50%)');
  });

  describe('darken', () => {
    it('darkens color by the amount provided', () => {
      const sourceColor = '#AAAAAA';
      const resultingColor = utils.darken(sourceColor, 5);

      expect(resultingColor).toBe('hsl(0, 0%, 61.7%)');
    });
  });

  describe('lighten', () => {
    it('lightens color by the amount provided', () => {
      const sourceColor = '#AAAAAA';
      const resultingColor = utils.lighten(sourceColor, 5);

      expect(resultingColor).toBe('hsl(0, 0%, 71.7%)');
    });
  });

  describe('hslToArray', () => {
    it('converts hsl string to an array of values', () => {
      const hsl = 'hsl(0, 0%, 71.7%)';

      const values = utils.hslToArray(hsl);
      expect(values).toEqual([0, 0, 71.7]);
    });
  });
});

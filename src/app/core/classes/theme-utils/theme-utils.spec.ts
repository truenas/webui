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

    const whiteRGB = utils.hexToRGB(white);
    expect(whiteRGB.rgb).toStrictEqual([255, 255, 255]);

    const redRGB = utils.hexToRGB(red);
    expect(redRGB.rgb).toStrictEqual([255, 0, 0]);

    const greenRGB = utils.hexToRGB(green);
    expect(greenRGB.rgb).toStrictEqual([0, 255, 0]);

    const blueRGB = utils.hexToRGB(blue);
    expect(blueRGB.rgb).toStrictEqual([0, 0, 255]);
  });

  // Convert RGB to Hex
  it('should convert RGB color strings to hex strings', () => {
    expect(utils).toBeTruthy();
    const whiteRGB = 'rgb(255,255,255)';
    const redRGB = 'rgb(255,0,0)';
    const greenRGB = 'rgb(0,255,0)';
    const blueRGB = 'rgb(0,0,255)';

    const white = utils.rgbToHex(whiteRGB);
    expect(white).toBe('#ffffff');

    const red = utils.rgbToHex(redRGB);
    expect(red).toBe('#ff0000');

    const green = utils.rgbToHex(greenRGB);
    expect(green).toBe('#00ff00');

    const blue = utils.rgbToHex(blueRGB);
    expect(blue).toBe('#0000ff');
  });

  // Convert RGB to HSL
  it('should convert RGB color strings to HSL color strings', () => {
    /*
     * HSL (Hue, Saturation, Level)
     * Values are Degrees, percent, percent
     * */

    const redRGB = 'rgb(255,0,0)';
    const red = utils.rgbToHSL(redRGB);
    expect(red).toBe('hsl(0, 100%, 50%)');

    const greenRGB = 'rgb(0,255,0)';
    const green = utils.rgbToHSL(greenRGB);
    expect(green).toBe('hsl(120, 100%, 50%)');

    const blueRGB = 'rgb(0,0,255)';
    const blue = utils.rgbToHSL(blueRGB);
    expect(blue).toBe('hsl(240, 100%, 50%)');
  });
});

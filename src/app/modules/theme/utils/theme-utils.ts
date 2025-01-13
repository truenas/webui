import { TinyColor } from '@ctrl/tinycolor';

/**
 * @deprecated Just use TinyColor https://www.npmjs.com/package/@ctrl/tinycolor
 */
export class ThemeUtils {
  textContrast(cssVar: string, bgVar: string): string {
    let txtColor = '';
    const rgb = new TinyColor(cssVar).toRgb();

    // Find the average value to determine brightness
    const brightest = (rgb.r + rgb.b + rgb.g) / 3;
    // Find a good threshold for when to have light text color
    if (brightest < 144) {
      txtColor = '#ffffff';
    } else if (brightest > 191) {
      txtColor = '#333333';
    } else {
      // RGB averages between 144-197 are to be
      // matched to bg2 css variable.
      const backgroundRgb = new TinyColor(bgVar).toRgb();
      const bgAvg = (backgroundRgb.r + backgroundRgb.g + backgroundRgb.b) / 3;
      if (bgAvg < 127) {
        txtColor = '#333333';
      } else {
        txtColor = '#ffffff';
      }
    }

    return txtColor;
  }

  getValueType(value: string): string {
    let valueType: string;
    if (value.startsWith('var')) {
      valueType = 'cssVar';
    } else if (value.startsWith('#')) {
      valueType = 'hex';
    } else if (value.startsWith('rgb(')) {
      valueType = 'rgb';
    } else if (value.startsWith('rgba(')) {
      valueType = 'rgba';
    } else {
      valueType = 'unknown';
    }

    return valueType;
  }

  colorFromMeta(meta: string): string {
    const trimFront = meta.replace('var(--', '');
    return trimFront.replace(')', '');
  }
}

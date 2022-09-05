export class ThemeUtils {
  textContrast(cssVar: string, bgVar: string): string {
    let txtColor = '';
    // Convert hex value to RGB
    const cssVarType = this.getValueType(cssVar);
    const props = cssVarType === 'hex' ? this.hexToRgb(cssVar) : { rgb: this.rgbToArray(cssVar) };

    // Find the average value to determine brightness
    const brightest = (props.rgb[0] + props.rgb[1] + props.rgb[2]) / 3;
    // Find a good threshold for when to have light text color
    if (brightest < 144) {
      txtColor = '#ffffff';
    } else if (brightest > 191) {
      txtColor = '#333333';
    } else {
      // RGB averages between 144-197 are to be
      // matched to bg2 css variable.
      const bgPropType = this.getValueType(bgVar);
      const bgProp = bgPropType === 'hex' ? this.hexToRgb(bgVar) : { rgb: this.rgbToArray(bgVar) };
      const bgAvg = (bgProp.rgb[0] + bgProp.rgb[1] + bgProp.rgb[2]) / 3;
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

  convertToRgb(value: string): { hex: string; rgb: number[] } {
    const valueType = this.getValueType(value);
    switch (valueType) {
      case 'hex':
        return this.hexToRgb(value);
      case 'rgba':
        const hex = this.rgbToHex(value);
        return this.hexToRgb(hex);
      default:
        throw new Error('Conversion from color format ' + valueType + ' is not currently supported.');
    }
  }

  hexToRgb(str: string): { hex: string; rgb: number[] } {
    const valueType = this.getValueType(str); // cssVar || hex || rgb || rgba
    if (valueType !== 'hex') console.error('This method takes a hex value as a parameter but was given a value of type ' + valueType);

    const spl = str.split('#');
    let hex = spl[1];
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    let value = '';
    const rgb = [];
    for (let i = 0; i < 6; i++) {
      const mod = i % 2;
      const even = 0;
      value += hex[i];
      if (mod !== even) {
        rgb.push(parseInt(value, 16));
        value = '';
      }
    }
    return {
      hex,
      rgb,
    };
  }

  rgbToHex(value: string): string {
    const [red, green, blue] = this.rgbToArray(value);

    const hex = '#' + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
    return hex;
  }

  rgbToArray(value: string): number[] {
    const alpha = value.startsWith('rgba');
    const prefix = alpha ? 'rgba(' : 'rgb(';
    const trimFront = value.replace(prefix, '');
    const trimmed = trimFront.replace(')', '');
    const output = trimmed.split(',');

    return output.map((str) => parseFloat(str));
  }

  rgbToString(rgb: number[], alpha?: number): string {
    const a = alpha ? alpha.toString() : '1';
    return 'rgba(' + rgb.join(',') + ',' + a + ')';
  }

  colorFromMeta(meta: string): string {
    const trimFront = meta.replace('var(--', '');
    const trimmed = trimFront.replace(')', '');
    return trimmed;
  }

  forceRgb(value: string): number[] {
    const valueType = this.getValueType(value);
    let rgb: number[];
    if (valueType === 'cssVar') {
      console.error('Cannot convert a variable. Please provide hex or rgb value');
    } else if (valueType === 'hsl') {
      console.error('Cannot convert hsl. Please provide hex or rgb value');
    } else {
      rgb = valueType === 'hex' ? this.hexToRgb(value).rgb : this.rgbToArray(value);
      return rgb;
    }
  }

  darken(value: string, pc: number): string {
    return this.adjustLightness(value, pc, 'darken');
  }

  lighten(value: string, pc: number): string {
    return this.adjustLightness(value, pc, 'lighten');
  }

  rgbToHsl(param: string | number[], inputString = true, outputString = true): number[] | string {
    const value: number[] = inputString ? this.forceRgb(param as string) : param as number[];

    const red = value[0] / 255;
    const green = value[1] / 255;
    const blue = value[2] / 255;

    const cmin = Math.min(red, green, blue);
    const cmax = Math.max(red, green, blue);
    const delta = cmax - cmin;

    let hue = 0;
    let saturation = 0;
    let lightness = 0;

    // Calculate Hue
    if (delta === 0) {
      hue = 0;
    } else if (cmax === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (cmax === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }

    hue = Math.round(hue * 60);
    // Make negative hues positive behind 360°
    if (hue < 0) hue += 360;

    // Calculate saturation and lightness
    lightness = (cmax + cmin) / 2;
    saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

    lightness = +(lightness * 100).toFixed(1);
    saturation = +(saturation * 100).toFixed(1);

    if (outputString) {
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    return [hue, saturation, lightness];
  }

  hslToArray(value: string): number[] {
    const alpha = value.startsWith('hsla');
    const prefix = alpha ? 'hsla(' : 'hsl(';
    const trimFront = value.replace(prefix, '');
    const trimmed = trimFront.replace(')', '');
    const output = trimmed.split(',');

    return output.map((str) => parseFloat(str));
  }

  private adjustLightness(value: string, pc: number, method = 'darken'): string {
    const rgb: number[] = this.forceRgb(value);
    const hsl = this.rgbToHsl(rgb, false, false) as number[];
    let lightness: number = method === 'lighten' ? hsl[2] + pc : hsl[2] - pc;
    lightness = lightness > 100 ? 100 : lightness;

    const adjusted = [hsl[0], hsl[1], lightness];

    return `hsl(${adjusted[0]}, ${adjusted[1]}%, ${adjusted[2]}%)`;
  }
}

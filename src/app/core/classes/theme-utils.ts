export class ThemeUtils {

  constructor() {
  }

  public textContrast(cssVar, bgVar){
    let txtColor = '';
    // Convert hex value to RGB
    const cssVarType = this.getValueType(cssVar);
    let props = cssVarType == 'hex' ? this.hexToRGB(cssVar) : { rgb: this.rgbToArray(cssVar) }; 

    // Find the average value to determine brightness
    let brightest = (props.rgb[0] + props.rgb[1] + props.rgb[2]) / 3;
    // Find a good threshold for when to have light text color
    if(brightest < 144){
      txtColor = "#ffffff"
    } else if(brightest > 191) {
      txtColor = "#333333"
    } else {
      // RGB averages between 144-197 are to be 
      // matched to bg2 css variable.
      const bgPropType = this.getValueType(bgVar);
      let bgProp = bgPropType == 'hex' ?  this.hexToRGB(bgVar) : { rgb: this.rgbToArray(bgVar) };
      let bgAvg = (bgProp.rgb[0] + bgProp.rgb[1] + bgProp.rgb[2]) / 3;
      if(bgAvg < 127){
        txtColor = "#333333";
      } else {
        txtColor = "#ffffff";
      }
    }


    return txtColor;
  }

  getValueType(value:string){
    let valueType: string;
    if(value.startsWith("var")){
      valueType = "cssVar";
    } else if(value.startsWith("#")){
      valueType = "hex";
    } else if(value.startsWith("rgb(")){
      valueType = "rgb";
    } else if(value.startsWith("rgba(")){
      valueType = "rgba";
    } else {
      valueType = "unknown";
    }

    return valueType;
    
  }

  convertToRGB(value: string){
    let valueType = this.getValueType(value);
    switch(valueType){
      case 'hex':
        return this.hexToRGB(value);
      break;
      case 'rgba':
        const hex = this.rgbToHex(value);
        return this.hexToRGB(hex);
      break;
      default:
        throw "Conversion from color format " + valueType + " is not currently supported."
      break;
    }
  }

  hexToRGB(str) {
    const valueType = this.getValueType(str); // cssVar || hex || rgb || rgba
    if(valueType != "hex") console.error("This method takes a hex value as a parameter but was given a value of type " + valueType);

    var spl = str.split('#');
    var hex = spl[1];
    if(hex.length == 3){
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    var value = '';
    var rgb = [];
    for(let i = 0; i < 6; i++){
      let mod = i % 2;
      let even = 0;
      value += hex[i];
      if(mod !== even){
        rgb.push(parseInt(value, 16))
        value = '';
      }
    }
    return {
      hex:hex,
      rgb:rgb
    }
  }

  rgbToHex(value: string):string {
    const arr = this.rgbToArray(value);
    const alpha = arr.length > 3;
    const r = arr[0];
    const g = arr[1];
    const b = arr[2];

    let hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return hex;
  }

  rgbToArray(value: string):number[]{
    const alpha = value.startsWith("rgba");
    const prefix = alpha ? "rgba(" : "rgb(";
    const trimFront = value.replace(prefix, "");
    const trimmed = trimFront.replace(")", "");
    const output = trimmed.split(",");
    
    return output.map((str) => parseFloat(str));
  }

  
  public colorFromMeta(meta:string):string{
    let trimFront = meta.replace('var(--','');
    let trimmed = trimFront.replace(')','');
    return trimmed;
  }

  forceRGB(value: string): number[]{
    const valueType = this.getValueType(value);
    let rgb: number[];
    if(valueType == 'cssVar'){
      console.error('Cannot convert a variable. Please provide hex or rgb value');
    } else if(valueType == 'hsl'){
      console.error('Cannot convert hsl. Please provide hex or rgb value');
    } else {
      rgb = valueType == 'hex' ? this.hexToRGB(value).rgb : this.rgbToArray(value);
      return rgb;
    }
  }

  darken(value: string, pc: number): string{
    return this.adjustLightness(value, pc, "darken");
  }

  lighten(value: string, pc: number ): string{ 
    return this.adjustLightness(value, pc, "lighten");
  }

  adjustLightness(value: string, pc: number, method: string = "darken"): string{ 
    const rgb: number[] = this.forceRGB(value);
    const hsl: number[] = this.rgbToHSL(rgb, false, false);
    let lightness:number = method == "lighten" ? hsl[2] + pc : hsl[2] - pc;
    lightness = lightness > 100 ? 100 : lightness;

    const adjusted = [hsl[0],hsl[1], lightness];
   
    const css =  "hsl(" + adjusted[0] + ", " + adjusted[1] + "%, " + adjusted[2] + "%)";

    const rgbStr = rgb.toString();
    const hslStr = adjusted.toString();
    
    return css;
  }

  rgbToHSL(param: any, inputString: boolean = true, outputString: boolean = true): any{
    const value = inputString ? this.forceRGB(param) : param;
     
    const r = value[0] /= 255;
    const g = value[1] /= 255;
    const b = value[2] /= 255;
    
    const cmin = Math.min(r,g,b);
    const cmax = Math.max(r,g,b);
    const delta = cmax - cmin;
    
    let h = 0;
    let s = 0;
    let l = 0;

    // Calculate Hue
    if(delta == 0){
      h = 0;
    } else if(cmax == r){
      h = ((g - b) / delta) % 6;
    } else if(cmax == g){
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h = Math.round(h * 60);
    // Make negative hues positive behind 360°
    if(h < 0) h += 360;

    // Calculate saturation and lightness
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    l = +(l * 100).toFixed(1);
    s = +(s * 100).toFixed(1);

    if(outputString){ 
      return "hsl(" + h + ", " + s + "%, " + l + "%)" 
    } else {
      return [h,s,l];
    }
  }


  hslToArray(value: string):number[]{
    const alpha = value.startsWith("hsla");
    const prefix = alpha ? "hsla(" : "hsl(";
    const trimFront = value.replace(prefix, "");
    const trimmed = trimFront.replace(")", "");
    const output = trimmed.split(",");
    
    return output.map((str) => parseFloat(str));
  }
}

import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';
import { Router } from '@angular/router';

export const DefaultTheme = {
      name:'ix-dark',
      label: "iX Dark",
      labelSwatch:"blue",
      description:'FreeNAS 11.2 default theme',
      accentColors:['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary:"var(--blue)",
      topbar:"#111111",
      'topbar-txt': "var(--fg2)",
      accent:"var(--bg2)",
      bg1:'#1E1E1E',
      bg2:'#242424',
      fg1:'#fff',
      fg2:'rgba(255,255,255,0.7)',
      'alt-bg1':'#383838',
      'alt-bg2':'#545454',
      'alt-fg1':'rgba(194,194,194,0.5)',
      'alt-fg2':'#e1e1e1',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#0095D5',
      cyan:'#00d0d6',
      green:'#1F9642'
    }

export interface Theme {
  name: string;
  description:string;
  label: string;
  labelSwatch?: string;
  accentColors: string[];
  topbar?: string; // CSS var from palette. Defaults to primary
  'topbar-txt'?: string; // Text color for topbar. Will be auto generated if nothing is set
  favorite?:boolean; // Deprecate: Hasn't been used since the theme switcher was in the topbar
  hasDarkLogo?: boolean; // Deprecate: logo colors are set with CSS now
  logoPath?:string; // Deprecate: Themes haven't used this in a couple of releases now
  logoTextPath?:string; // Deprecate: Themes haven't used this in a couple of releases now
  primary:string;
  accent:string;
  bg1:string
  bg2:string
  fg1:string
  fg2:string
  'alt-bg1':string
  'alt-bg2':string
  'alt-fg1':string
  'alt-fg2':string
  yellow:string
  orange:string
  red:string
  magenta:string
  violet:string
  blue:string
  cyan:string
  green:string
}

@Injectable()
export class ThemeService {
  readonly freeThemeDefaultIndex = 0;
  public activeTheme: string = 'default';
  public defaultTheme: string = 'ix-dark';
  public activeThemeSwatch: string[];

  // Theme lists
  public allThemes: Theme[];
  public themesMenu: Theme[];
  private _customThemes: Theme[];

  public freenasThemes: Theme[] = [
    DefaultTheme,
    {
      name:'ix-blue',
      label: "iX Blue",
      labelSwatch:"blue",
      description:'Official iX System Colors on light',
      accentColors:['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary:"var(--blue)",
      topbar:"var(--blue)",
      accent:"var(--yellow)",
      bg1:'#dddddd',
      bg2:'#ffffff',
      fg1:'#222222',
      fg2:'#333333',
      'alt-bg1':'rgba(122,152,182,0.05)',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#0095d5',
      cyan:'#00d0d6',
      green:'#59d600'
    },
    {
      name:'dracula',
      label: "Dracula",
      labelSwatch:"blue",
      description:'Dracula color theme',
      accentColors:['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary:"var(--blue)",
      topbar:"var(--blue)",
      accent:"var(--violet)",
      bg1:'#181a26',
      bg2:'#282a36',
      fg1:'#a8a8a2',
      fg2:'#cacac5',
      'alt-bg1':'rgba(122,122,122,0.25)',
      'alt-bg2':'rgba(122,122,122,0.5)',
      'alt-fg1':'#f8f8f2',
      'alt-fg2':'#fafaf5',
      yellow:'#f1fa8c',
      orange:'#ffb86c',
      red:'#ff5555',
      magenta:'#ff79c6',
      violet:'#bd93f9',
      blue:'#6272a4',
      cyan:'#8be9fd',
      green:'#50fa7b'
    },
    {
      name:'nord',
      label: "Nord",
      labelSwatch:"blue",
      description:'Unofficial nord color theme based on https://www.nordtheme.com/',
      accentColors:['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary:"var(--alt-bg2)",
      topbar:"var(--alt-bg2)",
      accent:"var(--blue)",
      bg1:'#2e3440',
      bg2:'#3b4252',
      fg1:'#eceff4',
      fg2:'#e5e9f0',
      'alt-bg1':'#434c5e',
      'alt-bg2':'#4c566a',
      'alt-fg1':'#d8dee9',
      'alt-fg2':'#d8dee9',
      yellow:'#ebcb8b',
      orange:'#d08770',
      red:'#bf616a',
      magenta:'#b48ead',
      violet:'#775daa',
      blue:'#5e81aC',
      cyan:'#88c0d0',
      green:'#a3be8c'
    },
    {
      name:'paper',
      label: "Paper",
      labelSwatch:"blue",
      description:'FreeNAS 11.2 default theme',
      accentColors:['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary:"var(--blue)",
      topbar:"var(--blue)",
      accent:"var(--yellow)",
      bg1:'#D5D5D5',
      bg2:'#F5F5F5',
      fg1:'#222222',
      fg2:'#333333',
      'alt-bg1':'rgba(122,152,182,0.05)',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#0D5687',
      cyan:'#00d0d6',
      green:'#1F9642'
    },
    {
      name:'solarized-dark',
      label: "Solarized Dark",
      labelSwatch:"bg2",
      description:'Solarized dark color scheme',
      accentColors:['blue', 'magenta', 'cyan', 'violet', 'green', 'orange', 'yellow', 'red'],
      primary:"var(--fg1)",
      topbar:"var(--fg1)",
      accent:"var(--cyan)",
      bg1:'#002b36',
      bg2:'#073642',
      fg1:'#586e75',
      fg2:'#7f99a2', 
      'alt-bg1':'rgba(122,122,122,0.25)',
      'alt-bg2':'#fdf6e3',
      'alt-fg1':'#839496',
      'alt-fg2':'#282a36',
      yellow:'#b58900',
      orange:'#cb4b16',
      red:'#dc322f',
      magenta:'#d33682',
      violet:'#6c71c4',
      blue:'#268bd2',
      cyan:'#2aa198',
      green:'#859900'
    },
    {
      name:'midnight',
      label: "Midnight",
      labelSwatch:"blue",
      description:'Dark theme with blues and greys',
      accentColors:['violet', 'orange', 'cyan', 'blue', 'yellow', 'magenta', 'red', 'green'],
      primary:"var(--blue)",
      topbar:"var(--blue)",
      accent:"var(--violet)",
      bg1:'#212a35',
      bg2:'#303d48',
      fg1:'#aaaaaa',
      fg2:'#cccccc',
      'alt-bg1':'rgba(122,122,122,0.25)',
      'alt-bg2':'#6F6E6C',
      'alt-fg1':'#c1c1c1',
      'alt-fg2':'#e1e1e1',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#1274b5',
      cyan:'#00d0d6',
      green:'#1F9642'
    },
    {
      name:'high-contrast',
      label: "High Contrast",
      labelSwatch:"fg1",
      description:'High contrast theme based on Legacy UI color scheme',
      accentColors:['green', 'violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue'],
      primary:"var(--blue)", 
      topbar:"var(--black)",
      accent:"var(--magenta)",
      bg1:'#dddddd',
      bg2:'#ffffff',
      fg1:'#222222',
      fg2:'#333333',
      'alt-bg1':'rgba(122,152,182,0.05)',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#9844b1',
      blue:'#4784ac',
      cyan:'#00d0d6',
      green:'#59d600'
    }
  ];

  savedUserTheme:string = "";
  private loggedIn:boolean;
  public globalPreview: boolean = false;
  public globalPreviewData: any;

  public userThemeLoaded: boolean = false;
  constructor(private rest: RestService, private ws: WebSocketService, private core:CoreService, private api:ApiService,
              private route: Router) {

    // Set default list
    this.allThemes = this.freenasThemes;
    this.themesMenu = this.freenasThemes;

    this.core.register({observerClass:this, eventName:"ThemeDataRequest"}).subscribe((evt:CoreEvent) => {
      this.core.emit({name:"ThemeData", data:this.findTheme(this.activeTheme), sender:this});
    });

    this.core.register({observerClass:this,eventName:"GlobalPreviewChanged"}).subscribe((evt:CoreEvent) => {
      if(evt.data){
        this.globalPreview = true;
      } else {
        this.globalPreview = false;
      }
      this.globalPreviewData = evt.data;
      if(this.globalPreview){
        this.setCssVars(evt.data.theme);
      } else if(!this.globalPreview){
        this.setCssVars(this.findTheme(this.activeTheme));
        this.globalPreviewData = null;
      }
    });

    this.core.register({observerClass:this,eventName:"UserPreferencesChanged"}).subscribe((evt:CoreEvent) => {
      this.onPreferences(evt);
    });

    this.core.register({observerClass:this,eventName:"UserPreferencesReady"}).subscribe((evt:CoreEvent) => {
      this.onPreferences(evt);
    });
  }

  onPreferences(evt:CoreEvent){
      if(evt.data.customThemes){
        this.customThemes = evt.data.customThemes;
      }

      this.activeTheme = evt.data.userTheme == "default" ? this.defaultTheme : evt.data.userTheme;
      this.setCssVars(this.findTheme(this.activeTheme, true));
      this.userThemeLoaded = true;
      this.core.emit({name:'ThemeChanged', data: this.findTheme(this.activeTheme), sender:this});

      if(evt.data.allowPwToggle){
        (<any>document).documentElement.style.setProperty("--toggle_pw_display_prop","inline");
      } else if(!evt.data.allowPwToggle){
        (<any>document).documentElement.style.setProperty("--toggle_pw_display_prop", "none");
      }
      
      if(evt.data.enableWarning){
        (<any>document).documentElement.style.setProperty("--enableWarning","inline");
      } else if(!evt.data.allowPwToggle){
        (<any>document).documentElement.style.setProperty("--enableWarning", "none");
      }
      
   
  }

  resetToDefaultTheme(){
    this.activeTheme = this.defaultTheme;
    this.changeTheme(this.defaultTheme);
  }

  currentTheme():Theme{
    return this.findTheme(this.activeTheme);
  }

  findTheme(name:string, reset?:boolean):Theme{
    if(name == 'default'){
      name = this.defaultTheme;
    }

    for(let i in this.allThemes){
      let t = this.allThemes[i];
      if(t.name == name){ return t;}
    }
    
    //Optionally reset if not found
    this.resetToDefaultTheme();

    if(!reset){
      console.warn('Theme ' + name + ' not found and reset not initiated.');
    }

    return this.freenasThemes[this.freeThemeDefaultIndex];
  }

  changeTheme(theme:string) {
    this.core.emit({name:"ChangeThemePreference", data:theme, sender:this});
    }

  saveCurrentTheme(){
    let theme = this.currentTheme();
    this.core.emit({name:"ChangeThemePreference", data:theme.name});
  }

  setCssVars(theme:Theme){ 
    let keys = Object.keys(theme);

    // Filter out deprecated properties and meta properties
    let palette = keys.filter( (v) => { return v != 'label' && v != 'logoPath' && v != 'logoTextPath' && v != 'favorite' && v != 'labelSwatch' && v != 'description' && v != 'name'; } )

    palette.forEach((color) => {
      let swatch = theme[color];
      
      // Generate aux. text styles 
      if(this.freenasThemes[0].accentColors.indexOf(color) !== -1){
        let txtColor = this.textContrast(theme[color], theme["bg2"]);
        (<any>document).documentElement.style.setProperty("--" + color + "-txt", txtColor);
      }

      (<any>document).documentElement.style.setProperty("--" + color, theme[color]);
    });

    // Add Black White and Grey Variables
    (<any>document).documentElement.style.setProperty("--black","#000000");
    (<any>document).documentElement.style.setProperty("--white","#ffffff");
    (<any>document).documentElement.style.setProperty("--grey","#989898");

    // Set Material palette colors
    (<any>document).documentElement.style.setProperty("--primary",theme["primary"]);
    (<any>document).documentElement.style.setProperty("--accent",theme["accent"]);

    // Set Material aux. text styles
    let primaryColor = this.colorFromMeta(theme["primary"]); // eg. blue
    let accentColor = this.colorFromMeta(theme["accent"]); // eg. yellow
    let primaryTextColor = this.textContrast(theme[primaryColor], theme["bg2"]);
    let accentTextColor = this.textContrast(theme[accentColor], theme["bg2"]);

    (<any>document).documentElement.style.setProperty("--primary-txt", primaryTextColor);
    (<any>document).documentElement.style.setProperty("--accent-txt", accentTextColor);
    (<any>document).documentElement.style.setProperty("--highlight", accentTextColor);

    let topbarTextColor;
    if(!theme['topbar-txt'] && theme.topbar) {
      topbarTextColor = this.textContrast(theme.topbar, theme["bg2"]);
      (<any>document).documentElement.style.setProperty("--topbar-txt", topbarTextColor);
    } else if(!theme['topbar-txt'] && !theme.topbar) {
      //topbarTextColor = this.textContrast(theme[accentColor], theme["bg2"]);
      topbarTextColor = this.textContrast(theme[primaryColor], theme["bg2"]);
      (<any>document).documentElement.style.setProperty("--topbar-txt", topbarTextColor);
    }

    // Logo light/dark
    if(theme["hasDarkLogo"]){
      theme.logoPath = 'assets/images/logo.svg';
      theme.logoTextPath = 'assets/images/logo-text.svg';
    } else {
      theme.logoPath = 'assets/images/light-logo.svg';
      theme.logoTextPath = 'assets/images/light-logo-text.svg';
    }
  }

  public textContrast(cssVar, bgVar){
    let txtColor = '';
    // Convert hex value to RGB
    let props = this.hexToRGB(cssVar); 

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
      let bgProp = this.hexToRGB(bgVar);
      let bgAvg = (bgProp.rgb[0] + bgProp.rgb[1] + bgProp.rgb[2]) / 3;
      if(bgAvg < 127){
        txtColor = "#333333";
      } else {
        txtColor = "#ffffff";
      }
    }


    return txtColor;
  }

  varToValue(cssVar:string){
    const prop = cssVar.replace('var(--', '').replace(')', '');
    const theme = this.currentTheme();
    console.log(prop);
    console.log(this.currentTheme());
    return theme[prop];
  }

  hexToRGB(str) {

    // Error Handling
    if(str.startsWith("var")){
      console.log("This is a variable and not a hex value");
      str = this.varToValue(str);
      console.log(str);
    }

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
  
  public colorFromMeta(meta:string){
    let trimFront = meta.replace('var(--','');
    let trimmed = trimFront.replace(')','');
    return trimmed;
  }

  get customThemes(){
    return this._customThemes;
  }

  set customThemes(customThemes:Theme[]){
    this._customThemes = customThemes;
    this.allThemes = this.freenasThemes.concat(this.customThemes);
    this.core.emit({name:"ThemeListsChanged"});
  }

}

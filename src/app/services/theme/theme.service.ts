import { Injectable } from '@angular/core';
import * as domHelper from '../../helpers/dom.helper';
import { RestService, WebSocketService } from 'app/services';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';
import { Router } from '@angular/router';

export interface Theme {
  name: string;
  description:string;
  label: string;
  labelSwatch?: string;
  accentColors: string[];
  favorite:boolean;
  hasDarkLogo: boolean;
  logoPath?:string;
  logoTextPath?:string;
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
  public activeTheme: string = 'ix-dark';
  public activeThemeSwatch: string[];

  // Theme lists
  public allThemes: Theme[];
  public favoriteThemes: Theme[];
  public themesMenu: Theme[];
  private _customThemes: Theme[];

  public freenasThemes: Theme[] = [
    {
      name:'ix-official',
      label: "iX Official",
      labelSwatch:"blue",
      description:'Official iX System Colors on Dark',
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue', 'green'],
      primary:"var(--blue)",
      //secondary:"var(--bg1)",
      accent:"var(--cyan)",
      bg1:'#252525',//'#171E26',
      bg2:'#343333',
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
      blue:'#0095D5',
      cyan:'#00d0d6',
      green:'#21C150'
    },
    {
      name:'ix-dark',
      label: "iX Dark",
      labelSwatch:"blue",
      description:'FreeNAS 11.2 default theme',
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue', 'green'],
      primary:"var(--blue)",
      //secondary:"var(--bg1)",
      accent:"var(--yellow)",
      bg1:'#171E26',
      bg2:'#232d35',//'#1D262D',
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
      blue:'#0D5788',
      cyan:'#00d0d6',
      green:'#1F9642'
    },
    {
      name:'ix-blue',
      label: "iX Blue",
      labelSwatch:"blue",
      description:'Official iX System Colors on light',
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:[ 'violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue', 'green'],
      primary:"var(--blue)",
      accent:"var(--yellow)",
      bg1:'#dddddd',
      bg2:'#ffffff',
      fg1:'#222222',
      fg2:'#333333',
      //'alt-bg1':'#f8f8f2',
      'alt-bg1':'rgba(122,152,182,0.05)',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#0095d5',//'#00a2ff',
      cyan:'#00d0d6',
      green:'#59d600'
    },
    {
      name:'dracula',
      label: "Dracula",
      labelSwatch:"blue",
      description:'Dracula color theme',
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['blue', 'green','violet', 'yellow', 'red', 'cyan', 'magenta', 'orange'],
      primary:"var(--blue)",
      accent:"var(--violet)",
      bg1:'#181a26',
      bg2:'#282a36',
      fg1:'#a8a8a2',
      fg2:'#cacac5',
      //'alt-bg1':'#f8f8f2',
      //'alt-bg2':'#fafaf5',
      'alt-bg1':'rgba(122,122,122,0.25)',
      'alt-bg2':'rgba(122,122,122,0.5)',
      //'alt-fg1':'#181a26',
      //'alt-fg2':'#282a36',
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
      name:'paper',
      label: "Paper",
      labelSwatch:"blue",
      description:'FreeNAS 11.2 default theme',
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue', 'green'],
      primary:"var(--blue)",
      //secondary:"var(--bg1)",
      accent:"var(--yellow)",
      bg1:'#D5D5D5',
      bg2:'#F5F5F5',
      fg1:'#222222',
      fg2:'#333333',
      /*'alt-bg1':'rgba(122,122,122,0.25)',
      'alt-bg2':'#6F6E6C',
      'alt-fg1':'#c1c1c1',
      'alt-fg2':'#e1e1e1',*/
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
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['blue', 'magenta', 'cyan', 'violet', 'green', 'orange', 'yellow', 'red'],
      primary:"var(--fg1)",
      accent:"var(--cyan)",
      bg1:'#002b36',
      bg2:'#073642',
      fg1:'#586e75',
      fg2:'#7f99a2', //'#657b83',
      //'alt-bg1':'#eee8d5',
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
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue', 'green'],
      primary:"var(--blue)",
      //secondary:"var(--bg1)",
      accent:"var(--violet)",
      bg1:'#212a35',
      bg2:'#303d48',//'#1D262D',
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
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['green', 'violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue'],
      primary:"var(--fg2)",
      accent:"var(--yellow)",
      bg1:'#dddddd',
      bg2:'#ffffff',
      fg1:'#222222',
      fg2:'#333333',
      //'alt-bg1':'#f8f8f2',
      'alt-bg1':'rgba(122,152,182,0.05)',
      'alt-bg2':'#fafaf5',
      'alt-fg1':'#181a26',
      'alt-fg2':'#282a36',
      yellow:'#f0cb00',
      orange:'#ee9302',
      red:'#ff0013',
      magenta:'#d238ff',
      violet:'#c17ecc',
      blue:'#00a2ff',
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

    this.core.register({observerClass:this,eventName:"Authenticated", sender:this.api}).subscribe((evt:CoreEvent) => {
      this.core.emit({name:"ThemeChanged", data:this.findTheme(this.activeTheme), sender:this});
      this.loggedIn = evt.data;
      if(this.loggedIn == true){
        this.core.emit({ name:"UserDataRequest",data:[[["id", "=", 1]]] });
      } else {
        //console.warn("SETTING DEFAULT THEME");
        this.resetToDefaultTheme();
      }
    });

    this.core.register({observerClass:this, eventName:"ThemeDataRequest"}).subscribe((evt:CoreEvent) => {
      this.core.emit({name:"ThemeData", data:this.findTheme(this.activeTheme), sender:this});
    });

    this.core.register({observerClass:this,eventName:"GlobalPreviewChanged"}).subscribe((evt:CoreEvent) => {
      console.log("GlobalPreview callback")
      //this.globalPreview = !this.globalPreview;
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
      if(evt.data.customThemes){
        this.customThemes = evt.data.customThemes;
      }

      //if(evt.data.userTheme !== this.activeTheme){
        this.activeTheme = evt.data.userTheme;
        this.setCssVars(this.findTheme(this.activeTheme, true));
        this.userThemeLoaded = true;
        this.core.emit({name:'ThemeChanged', data: this.findTheme(this.activeTheme), sender:this});
      //}

      if(evt.data.showTooltips){
        (<any>document).documentElement.style.setProperty("--tooltip","inline");
      } else if(!evt.data.showTooltips){
        (<any>document).documentElement.style.setProperty("--tooltip","none");
      }

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

    });
  }

  resetToDefaultTheme(){
    this.activeTheme = "ix-official";
    this.changeTheme(this.activeTheme);
  }

  currentTheme():Theme{
    return this.findTheme(this.activeTheme);
  }

  findTheme(name:string, reset?:boolean):Theme{
    for(let i in this.allThemes){
      let t = this.allThemes[i];
      if(t.name == name){ return t;}
    }
    
    //Optionally reset if not found
    this.resetToDefaultTheme();

    if(!reset){
      console.warn('Theme not found and reset not initiated.');
    }

    return this.freenasThemes[this.freeThemeDefaultIndex];
  }

  changeTheme(theme:string) {
    //console.log("THEME SERVICE THEMECHANGE: changing to " + theme + " theme");
    this.core.emit({name:"ChangeThemePreference", data:theme, sender:this});
    //this.core.emit({name:'ThemeChanged'});
    }

  saveCurrentTheme(){
    //console.log("SAVING CURRENT THEME");
    let theme = this.currentTheme();
    this.core.emit({name:"ChangeThemePreference", data:theme.name});
  }

  setCssVars(theme:Theme){ 
    let palette = Object.keys(theme);

    // Isolate palette colors
    palette.splice(0,7);

    palette.forEach((color) => {
      let swatch = theme[color];
      
      // Generate aux. text styles 
      if(this.freenasThemes[0].accentColors.indexOf(color) !== -1){
        let txtColor = this.textContrast(theme[color], theme["bg2"]);
        (<any>document).documentElement.style.setProperty("--" + color + "-txt", txtColor);
      }

      (<any>document).documentElement.style.setProperty("--" + color, theme[color]);
    });

    // Set Material palette colors
    (<any>document).documentElement.style.setProperty("--primary",theme["primary"]);
    (<any>document).documentElement.style.setProperty("--accent",theme["accent"]);

    // Set Material aux. text styles
    let primaryColor = this.colorFromMeta(theme["primary"]); // eg. blue
    let accentColor = this.colorFromMeta(theme["accent"]); // eg. yellow
    let primaryTextColor = this.textContrast(theme[primaryColor], theme["bg2"]);
    let accentTextColor = this.textContrast(theme[accentColor], theme["bg2"]);
    (<any>document).documentElement.style.setProperty("--primary-txt", /*'var(--' + primaryColor + '-txt)'*/primaryTextColor);
    (<any>document).documentElement.style.setProperty("--accent-txt", /*'var(--' + accentColor + '-txt)'*/accentTextColor);
    (<any>document).documentElement.style.setProperty("--highlight", accentTextColor);

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

  hexToRGB(str) {
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
    let result = [];
    for(let i = 0; i < customThemes.length; i++){
      if(customThemes[i].favorite){
        result.push(customThemes[i]);
      }
    }
    this._customThemes = customThemes;
    this.favoriteThemes = result; 
    this.allThemes = this.freenasThemes.concat(this.customThemes);
    this.themesMenu = this.freenasThemes.concat(this.favoriteThemes);
    this.core.emit({name:"ThemeListsChanged"});
  }

}

import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../services/language.service';
import { Theme } from 'app/services/theme/theme.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']

})
export class AuthLayoutComponent implements OnInit {

  /*private theme:Theme = {
    name:'ix-blue',
    label: "iX Blue",
    description:'iX System Colors',
    hasDarkLogo:false,
    favorite:false,
    accentColors:['blue', 'orange','green', 'violet','cyan', 'magenta', 'yellow','red'],
    primary:"var(--blue)",
    accent:"var(--yellow)",
    bg1:'#dddddd',
    bg2:'#ffffff',
    fg1:'#222222',
    fg2:'#333333',
    'alt-bg1':'#f8f8f2',
    'alt-bg2':'#fafaf5',
    'alt-fg1':'#181a26',
    'alt-fg2':'#282a36',
    yellow:'#f0cb00',
    orange:'#eec302',
    red:'#ff0013',
    magenta:'#d238ff',
    violet:'#c17ecc',
    blue:'#00a2ff',
    cyan:'#00d0d6',
    green:'#59d600'
  }*/i

  private theme:Theme = {
      name:'ix-dark',
      label: "iX Dark",
      labelSwatch:"blue",
      description:'iX System Colors on Dark',
      hasDarkLogo:false,
      logoPath:'assets/images/light-logo.svg',
      logoTextPath:'light-logo-text.svg',
      favorite:false,
      accentColors:['green', 'violet', 'orange', 'cyan', 'magenta', 'red', 'yellow', 'blue'],
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
    }


  constructor(public language: LanguageService) {
    // Translator init
    language.getBrowserLanguage();
  }

  ngOnInit() {
    this.setCssVars(this.theme);
  }

  setCssVars(theme:Theme){

    let palette = Object.keys(theme);
    palette.splice(0,6);

    let admin_layout_el = (<any>document).getElementsByTagName('APP-AUTH-LAYOUT')[0];

    palette.forEach(function(color){
      let swatch = theme[color];
      admin_layout_el.style.setProperty("--" + color, theme[color]);
      (<any>document).documentElement.style.setProperty("--" + color, theme[color]);
    });
    admin_layout_el.style.setProperty("--primary",theme["primary"]);
    admin_layout_el.style.setProperty("--accent",theme["accent"]);
    (<any>document).documentElement.style.setProperty("--primary",theme["primary"]);
    (<any>document).documentElement.style.setProperty("--accent",theme["accent"]);
  }

}

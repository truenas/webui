import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../services/language.service';
import { Theme } from 'app/services/theme/theme.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']

})
export class AuthLayoutComponent implements OnInit {

  private theme:Theme = {
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

    palette.forEach(function(color){
      let swatch = theme[color];
      (<any>document).documentElement.style.setProperty("--" + color, theme[color]);
    });
    (<any>document).documentElement.style.setProperty("--primary",theme["primary"]);
    (<any>document).documentElement.style.setProperty("--accent",theme["accent"]);
  }

}

import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../services/language.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent implements OnInit {

  constructor(public language: LanguageService) {
    // Translator init
    language.getBrowserLanguage();
  }

  ngOnInit() {
  }

}

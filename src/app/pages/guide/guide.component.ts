import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DocsService } from '../../services/docs.service';

import urls from '../../helptext/urls';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.css'],
})

export class GuideComponent implements OnInit{

  public safeUrl: SafeUrl;

  constructor(public sanitizer: DomSanitizer, public docsService: DocsService) {}

  ngOnInit() {
  const url = this.docsService.docReplace("%%docurl%%");
//  this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl("//" + environment.remote + "//docs/freenas.html");
  this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.css'],
})

export class GuideComponent implements OnInit{

  public safeUrl: SafeUrl;

  constructor(public sanitizer: DomSanitizer) {}

  ngOnInit() {
	this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl("//" + environment.remote + "//docs/freenas.html");
  }
}
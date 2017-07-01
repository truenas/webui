import 'style-loader!./page-not-found.scss';

import {Location} from '@angular/common';
import {Component} from '@angular/core';
import {Router, RouterModule, Routes} from '@angular/router';

@Component({selector : 'page-not-found', templateUrl : './404.html'})
export class PageNotFoundComponent {
  constructor(protected location: Location) {}

  goBack() { this.location.back(); }
}
import 'style-loader!./app.scss';
import 'style-loader!./theme/initial.scss';

import {Component, ViewContainerRef} from '@angular/core';
import * as $ from 'jquery';

import {GlobalState} from './global.state';
import {
  BaImageLoaderService,
  BaThemePreloader,
  BaThemeSpinner
} from './theme/services';
import {BaThemeConfig} from './theme/theme.config';
import {layoutPaths} from './theme/theme.constants';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector : 'app',
  template : `
    <main [ngClass]="{'menu-collapsed': isMenuCollapsed}" baThemeRun>
      <div class="additional-bg"></div>
      <router-outlet></router-outlet>
    </main>
  `
})
export class App {

  isMenuCollapsed: boolean = false;

  constructor(private _state: GlobalState,
              private _imageLoader: BaImageLoaderService,
              private _spinner: BaThemeSpinner,
              private viewContainerRef: ViewContainerRef,
              private themeConfig: BaThemeConfig) {

    themeConfig.config();

    this._loadImages();

    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });
  }

  public ngAfterViewInit(): void {
    // hide spinner once all loaders are completed
    BaThemePreloader.load().then((values) => { this._spinner.hide(); });
  }

  private _loadImages(): void {
    // register some loaders
    //BaThemePreloader.registerLoader(
      // Hey Guys James/Erin sorry to comment this out.. It was hanging the application on load  (Last checkin ID: 9418294d07b46f36547d2fd0effb694103a1a367)
      //this._imageLoader.load(layoutPaths.images.root + ''));
      
      // This is the line of code as it was before the above line was here (last before last checkin)
      //this._imageLoader.load(layoutPaths.images.root + 'sky-bg.jpg'));
  }
}

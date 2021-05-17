import { Component, Input, OnInit } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreEvent } from 'app/interfaces/events';
import { ThemeService } from 'app/services/theme/theme.service';
import { Subject } from 'rxjs';
import { View } from 'app/core/classes/view';

// This makes the metadata available globally
// Deal Breaker: Angular injects the component's
// directory path forcing relative paths
export const ViewComponentMetadata = {
  selector: 'view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
};

@Component({
  selector: 'view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
})
export class ViewComponent extends View {
  readonly componentName = ViewComponent;
  protected _data: any;
  viewController: Subject<CoreEvent>;
  protected themeService: ThemeService;

  constructor() {
    super();
    this.themeService = CoreServiceInjector.get(ThemeService);
  }

  set data(data: any) {
    this._data = data;
  }

  get data(): any {
    return this._data;
  }

  colorsFromTheme(): string[] {
    const theme = this.themeService.currentTheme();
    const accentColors: string[] = []; // [theme.magenta, theme.cyan, theme.red, theme.blue, theme.green, theme.orange, theme.yellow, theme.violet]
    for (let i = 0; i < theme.accentColors.length; i++) {
      accentColors.push((theme as any)[theme.accentColors[i]]);
    }
    return accentColors;
  }
}

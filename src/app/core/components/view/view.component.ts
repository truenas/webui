import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { View } from 'app/core/classes/view';
import { CoreServiceInjector } from 'app/core/services/core-service-injector';
import { CoreEvent } from 'app/interfaces/events';
import { ThemeService } from 'app/services/theme/theme.service';

// This makes the metadata available globally
// Deal Breaker: Angular injects the component's
// directory path forcing relative paths
export const ViewComponentMetadata = {
  selector: 'view',
  templateUrl: './view.component.html',
};

@Component({
  selector: 'view',
  templateUrl: './view.component.html',
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
    return theme.accentColors.map((color) => theme[color]);
  }
}

import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { View } from 'app/core/classes/view';
import { CoreEvent } from 'app/interfaces/events';
import { ThemeService } from 'app/services/theme/theme.service';

@Component({
  selector: 'view',
  templateUrl: './view.component.html',
})
export class ViewComponent extends View {
  protected _data: any;
  viewController: Subject<CoreEvent>;

  constructor(
    protected themeService: ThemeService,
  ) {
    super();
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

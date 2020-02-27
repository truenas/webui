import { Component, Input, OnInit } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { ThemeService } from 'app/services/theme/theme.service';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';
import { View } from 'app/core/classes/view';

// This makes the metadata available globally
// Deal Breaker: Angular injects the component's
// directory path forcing relative paths
export const ViewComponentMetadata = {
  selector: 'view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
}

@Component({
  selector: 'view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css']
})
export class ViewComponent extends View {

  readonly componentName = ViewComponent;
  protected _data: any;
  public viewController: Subject<CoreEvent>;
  protected themeService: ThemeService;

  constructor(){
    super();
    this.themeService = CoreServiceInjector.get(ThemeService);
  }

  ngOnInit() {

  }
  
  set data(data:any){
    this._data = data;
  }

  get data(){
    return this._data;
  }

  colorsFromTheme(){
    let theme = this.themeService.currentTheme();
    let accentColors: string[] = []; //[theme.magenta, theme.cyan, theme.red, theme.blue, theme.green, theme.orange, theme.yellow, theme.violet]
    for(let i = 0; i < theme.accentColors.length; i++){
      accentColors.push(theme[theme.accentColors[i]]);
    }
    return accentColors;
  }
}

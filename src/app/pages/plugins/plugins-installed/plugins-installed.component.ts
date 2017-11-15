import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { RestService, WebSocketService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-plugins-installed-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class PluginsInstalledListComponent {

  public title = "Installed Plugins";
  protected queryCall = 'jail.list_resource';
  protected queryCallOption = ["PLUGIN"];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Name', prop: '1' },
    { name: 'Boot', prop: '2' },
    { name: 'State', prop: '3' },
    { name: 'Type', prop: '4' },
    { name: 'Release', prop: '5' },
    { name: 'IP4 address', prop: '6' },
    { name: 'IP6 address', prop: '7' },
    { name: 'Template', prop: '8' }
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService) {}

}

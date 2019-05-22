import { Component } from '@angular/core'

import { AvailablePluginsComponent } from './available-plugins/available-plugins.component';
import { PluginComponent } from './plugin/plugin.component';

import { T } from '../../translate-marker';

@Component({
  selector: 'app-plugins-ui',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class PluginsComponent {
  public title = "Plugins";
  protected queryCall = 'jail.list_resource';
  protected queryCallOption = ["PLUGIN"];
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';

  public columns: Array<any> = [
    { name: T('Jail'), prop: '1' },
    { name: T('Status'), prop: '3' },
    { name: T('IPv4 Address'), prop: '6' },
    { name: T('IPv6 Address'), prop: '7' },
    // { name: T('Version'), prop: '10' },
    // { name: T('Boot'), prop: '2' },
    // { name: 'Type', prop: '4' },
    // { name: T('Release'), prop: '5' },
    // { name: T('Template'), prop: '8' }
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    // multiSelect: true,
    deleteMsg: {
      title: 'Plugin',
      key_props: ['1'],
      id_prop: '1',
    },
  };
  protected cardHeaderComponent = AvailablePluginsComponent;
  protected showActions = false;
  protected hasDetails = true;
  protected rowDetailComponent = PluginComponent;

}

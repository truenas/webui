import { Component } from '@angular/core';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-initshutdown-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class InitshutdownListComponent {

  public title = "Init/Shutdown Scripts"
  protected queryCall = 'initshutdownscript.query';
  protected wsDelete = 'initshutdownscript.delete';
  protected route_add: string[] = ['tasks', 'initshutdown', 'add'];
  protected route_add_tooltip = "Add Init/Shutdown Scripts";
  protected route_edit: string[] = ['tasks', 'initshutdown', 'edit'];
  protected entityList: any;

  public columns: Array<any> = [
    { name: T('Type'), prop: 'type' },
    { name: T('Command'), prop: 'command', hidden: true },
    { name: T('Script'), prop: 'script', hidden: true },
    { name: T('Description'), prop: 'comment' },
    { name: T('When'), prop: 'when' },
    { name: T('Enabled'), prop: 'enabled' },
    { name: T('Timeout'), prop: 'timeout', hidden: true },
  ];
  public rowIdentifier = 'type';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script']
    },
  };

  constructor() { }
}

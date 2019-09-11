import { Component } from '@angular/core';

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
    { name: 'Type', prop: 'type' },
    { name: 'Command', prop: 'command' },
    { name: 'Script', prop: 'script' },
    { name: 'When', prop: 'when' },
    { name: 'Enabled', prop: 'enabled' },
    { name: 'Timeout', prop: 'timeout' },
  ];
  public rowIdentifier = 'type';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Init/Shutdown Script',
      key_props: ['type', 'command', 'script']
    },
  };

  constructor() { }
}

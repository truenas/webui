import {Component} from '@angular/core';

@Component({
  selector : 'system-tunable-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class TunableDeleteComponent {

  protected resource_name: string = 'system/tunable';
  protected route_success: string[] = [ 'system', 'tunable' ];
  protected skipGet: boolean = true;
}

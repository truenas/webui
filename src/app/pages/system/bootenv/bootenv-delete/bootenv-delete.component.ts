import {Component} from '@angular/core';

@Component({
  selector : 'app-bootenv-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class BootEnvironmentDeleteComponent {

  protected resource_name: string = 'system/bootenv';
  protected route_success: string[] = [ 'system', 'bootenv' ];
  protected skipGet: boolean = true;
}

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-iscsi-associated-target-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class AssociatedTargetDeleteComponent {
  protected resource_name: string = 'services/iscsi/targettoextent';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'associatedtarget' ];
}

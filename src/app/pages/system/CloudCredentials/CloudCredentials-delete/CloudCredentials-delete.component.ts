import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector : 'app-vm-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class CloudCredentialsDeleteComponent {

  protected resource_name: string = '';
  protected deletequery: string = 'backup.credential.delete';
  protected fetchquery: string = 'backup.credential.query';
  protected route_success: string[] = ['system', 'cloudcredentials'];
}

import { Component } from '@angular/core';

@Component({
  selector: 'system-ca-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class CertificateAuthorityDeleteComponent {

  protected resource_name: string = 'system/certificateauthority';
  protected route_success: string[] = ['system','ca'];
  protected skipGet: boolean = true;
}

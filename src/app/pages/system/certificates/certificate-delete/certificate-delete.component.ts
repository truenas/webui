import { Component } from '@angular/core';

@Component({
  selector: 'app-snapshot-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class CertificateDeleteComponent {

  protected resource_name: string = 'system/certificate';
  protected route_success: string[] = ['system','certificates'];
  protected skipGet: boolean = true;
}

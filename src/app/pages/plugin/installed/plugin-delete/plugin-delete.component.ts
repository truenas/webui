import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-installed-plugin-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class PluginDeleteComponent {

  protected resource_name: string = 'plugins/plugins';
  protected route_success: string[] = ['plugins', 'installed'];

}

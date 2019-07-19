

import { Injectable } from '@angular/core';

import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class JailService {
  public jailNameRegex = /^[a-zA-Z0-9\._-]+$/;

  constructor(protected rest: RestService, protected ws: WebSocketService) { };

  listJails() { return this.ws.call('jail.query', {}); }

  getReleaseChoices() {
    return this.ws.call('jail.releases_choices');
  }

  getBranches() {
    return this.ws.job('plugin.official_repositories');
  }

  getVersion() {
    return this.ws.call('jail.get_version');
  }

  getInstalledPlugins() {
    return this.ws.job('plugin.query');
  }

  getTemplates() {
    return this.ws.call('jail.query', [[['type', '=', 'template']]]);
  }

  getInterfaceChoice() {
    return this.ws.call('jail.interface_choices');
  }
}

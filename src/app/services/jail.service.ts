import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class JailService {
  jailNameRegex = /^[a-zA-Z0-9\._-]+$/;

  constructor(protected rest: RestService, protected ws: WebSocketService) { }

  listJails(): Observable<any[]> {
    return this.ws.call('jail.query', {});
  }

  getReleaseChoices(): Observable<any[]> {
    return this.ws.call('jail.releases_choices', [true]);
  }

  getBranches(): Observable<any> {
    return this.ws.job('plugin.official_repositories');
  }

  getVersion(): Observable<any> {
    return this.ws.call('jail.get_version');
  }

  getInstalledPlugins(): Observable<any[]> {
    return this.ws.job('plugin.query');
  }

  getTemplates(): Observable<any[]> {
    return this.ws.call('jail.query', [[['type', '=', 'template']]]);
  }

  getInterfaceChoice(): Observable<any> {
    return this.ws.call('jail.interface_choices');
  }

  getDefaultConfiguration(): Observable<any> {
    return this.ws.call('jail.default_configuration');
  }
}

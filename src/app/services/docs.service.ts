import { Injectable } from '@angular/core';
import urls from 'app/helptext/urls';
import { SystemGeneralService } from 'app/services/system-general.service';

@Injectable({
  providedIn: 'root',
})
export class DocsService {
  constructor(
    private systemGeneralService: SystemGeneralService,
  ) { }

  docReplace(message: string): string {
    if (message !== undefined && typeof message === 'string') {
      // For some reason # markers are getting a "\" appended to them by the translate service now
      message = message.replace(/\\#/g, '#');

      for (const url in urls) {
        const replace = new RegExp('--' + url + '--', 'g');
        message = message.replace(replace, urls[url as keyof typeof urls]);
      }
      const runningVersion = window.localStorage.getItem('running_version');
      if (runningVersion) {
        const webVersion = '?runningversion=' + runningVersion;
        const version = runningVersion.split('-');
        version.shift();
        const docVersion = version.join('-');
        if (version && version.length > 1) {
          message = message.replace(/--version--/g, docVersion);
        }
        if (webVersion) {
          message = message.replace(/--webversion--/g, webVersion);
        }
        if (runningVersion) {
          message = message.replace(/--runningversion--/g, runningVersion);
        }
      }

      const productType = this.systemGeneralService.getProductType();
      message = message.replace(/--nas--/g, `truenas ${productType}`);
      message = message.replace(/--NAS--/g, `TrueNAS ${productType}`);
    }

    return message;
  }
}

import { Injectable } from '@angular/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLink } from 'app/modules/alerts/services/alert-link.interface';
import { supportedLinks } from 'app/modules/alerts/services/supported-links.const';

@Injectable({
  providedIn: 'root',
})
export class AlertLinkService {
  constructor(
    private navigateAndHighlight: NavigateAndHighlightService,
  ) { }

  openLink(alertClass: AlertClassName): void {
    const link = this.getLink(alertClass);
    if (link) {
      this.navigateAndHighlight.navigateAndHighlight(link.route, link.hash);
    }
  }

  getLink(alertClass: AlertClassName): AlertLink | null {
    return supportedLinks.find((supportedlLink) => {
      return supportedlLink.classes.includes(alertClass);
    })?.link || null;
  }
}

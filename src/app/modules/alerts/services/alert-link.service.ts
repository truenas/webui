import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { AlertLink } from 'app/modules/alerts/services/alert-link.interface';
import { supportedLinks } from 'app/modules/alerts/services/supported-links.const';
import { isBootPoolAlert } from 'app/modules/alerts/utils/boot-pool.utils';
import { bootListElements } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.elements';

@Injectable({
  providedIn: 'root',
})
export class AlertLinkService {
  private navigateAndHighlight = inject(NavigateAndHighlightService);
  private translate = inject(TranslateService);

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

  openLinkForAlert(alert: Alert): void {
    const link = this.getLinkForAlert(alert);
    if (link) {
      this.navigateAndHighlight.navigateAndHighlight(link.route, link.hash);
    }
  }

  getLinkForAlert(alert: Alert): AlertLink | null {
    // Special handling for ZpoolCapacity alerts - check if it's for boot pool
    if (this.isZpoolCapacityAlert(alert.klass) && isBootPoolAlert(alert.args)) {
      return {
        label: this.translate.instant('Manage boot pool'),
        route: bootListElements.anchorRouterLink,
      };
    }

    // Default behavior - use existing logic
    return this.getLink(alert.klass);
  }

  private isZpoolCapacityAlert(alertClass: AlertClassName): boolean {
    return [
      AlertClassName.ZpoolCapacityCritical,
      AlertClassName.ZpoolCapacityWarning,
      AlertClassName.ZpoolCapacityNotice,
    ].includes(alertClass);
  }
}

import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnTooltipDirective,
  type TnTestIdValue,
} from '@truenas/ui-components';
import { WebShareService } from 'app/pages/sharing/webshare/webshare.service';

/**
 * Opens WebShare (or one share). When the current connection has no `.truenas.direct` hostname
 * of its own but TrueNAS Connect knows hostnames for other IPs, it becomes a menu of those IPs.
 */
@Component({
  selector: 'ix-webshare-open-button',
  templateUrl: './webshare-open-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TnTooltipDirective,
    TranslateModule,
  ],
})
export class WebShareOpenButtonComponent {
  private webShareService = inject(WebShareService);
  private translate = inject(TranslateService);

  readonly shareName = input<string>();
  readonly variant = input<'button' | 'icon'>('button');
  readonly testId = input.required<TnTestIdValue>();
  readonly ariaLabel = input<string>();

  protected readonly hostnameChoices = this.webShareService.hostnameChoices;
  protected readonly unavailableReason = this.webShareService.webShareUnavailableReason;

  /**
   * Only offer the IP menu when WebShare can actually be opened; a stopped service or disabled
   * TrueNAS Connect falls through to the disabled button with its reason.
   */
  protected readonly showsMenu = computed(() => !!this.hostnameChoices().length && !this.unavailableReason());

  protected readonly isIcon = computed(() => this.variant() === 'icon');

  protected readonly tooltip = computed(() => {
    if (this.unavailableReason()) {
      return this.unavailableReason();
    }
    if (this.showsMenu()) {
      return this.translate.instant('Choose the IP address to open WebShare through');
    }
    return this.isIcon() ? this.translate.instant('Open') : '';
  });

  protected readonly iconAriaLabel = computed(() => [this.tooltip(), this.ariaLabel()].filter(Boolean).join(' '));

  // Projected menu items don't inherit a `tn-menu` test id base, so each item carries the full id.
  protected menuItemTestId(ip: string): TnTestIdValue {
    return [this.testId(), 'hostname', ip].flat();
  }

  protected open(hostname?: string): void {
    this.webShareService.openWebShare(this.shareName(), hostname);
  }
}

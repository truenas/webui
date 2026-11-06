import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import {
  scopeTestId, TnTestIdDirective, TnTooltipDirective, type TnTestIdValue,
} from '@truenas/ui-components';

/**
 * What every premium surface says when asked why it is locked. One string, so
 * the answer cannot drift between the places that give it.
 */
export const premiumFeatureExplanation = T(
  'Premium features are available with TrueNAS Connect subscriptions, or on TrueNAS Enterprise appliances.',
);

/**
 * The "Premium" tag beside a feature this appliance isn't entitled to, explaining how to get it.
 * Usually placed by `*ixPremiumFeature`. A button so the tooltip is reachable by keyboard and tap,
 * since the library's tooltip shows on focus; the click toggles it so a second tap dismisses it.
 */
@Component({
  selector: 'ix-premium-badge',
  templateUrl: './premium-badge.component.html',
  styleUrls: ['./premium-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTooltipDirective, TnTestIdDirective, TranslateModule],
})
export class PremiumBadgeComponent {
  /** Distinguishes this badge from the others on the same screen. */
  readonly testId = input<TnTestIdValue>(undefined);

  private readonly tooltip = viewChild.required(TnTooltipDirective);

  protected readonly explanation = premiumFeatureExplanation;

  /**
   * The library's own way to derive a child id from a caller's base, which may
   * itself be several segments. Hand-building the array types the base as one
   * segment and nests an array inside one when it is not.
   */
  protected readonly scopeTestId = scopeTestId;

  protected toggleExplanation(): void {
    this.tooltip().toggle();
  }
}

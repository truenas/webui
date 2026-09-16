import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

/**
 * What every premium surface says when asked why it is locked. One string, so
 * the answer cannot drift between the places that give it.
 */
export const premiumFeatureExplanation = T(
  'Premium features are available with TrueNAS Connect memberships, or on TrueNAS Enterprise appliances.',
);

/**
 * The "Premium" tag beside a feature this appliance is not entitled to, and the
 * one place that explains what to do about it.
 *
 * Usually reached through `*ixPremiumFeature`, which pairs it with the greying;
 * on its own for a surface that wants the tag without the wrapper — a heading
 * whose controls are gated individually, say.
 *
 * A button rather than a decorated span, deliberately. The explanation has to
 * be reachable without a mouse, and `matTooltip` shows on focus as well as
 * hover, which a button gets from a tab, a click and a tap alike. The click
 * handler toggles on top of that, so a second tap on a touch screen dismisses
 * the tooltip rather than leaving it stranded.
 */
@Component({
  selector: 'ix-premium-badge',
  templateUrl: './premium-badge.component.html',
  styleUrls: ['./premium-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltip, TestDirective, TranslateModule],
})
export class PremiumBadgeComponent {
  /** Distinguishes this badge from the others on the same screen. */
  readonly testId = input<string>('');

  private readonly tooltip = viewChild.required(MatTooltip);

  protected readonly explanation = premiumFeatureExplanation;

  protected toggleExplanation(): void {
    this.tooltip().toggle();
  }
}

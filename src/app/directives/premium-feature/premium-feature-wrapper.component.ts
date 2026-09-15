import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, TemplateRef,
} from '@angular/core';
import { type TnTestIdValue } from '@truenas/ui-components';
import { DisableFocusableElementsDirective } from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { PremiumBadgeComponent } from 'app/directives/premium-feature/premium-badge.component';

/**
 * Renders a feature this appliance is not entitled to: visible, inert and
 * dimmed, with the {@link PremiumBadgeComponent} beside it.
 *
 * Built by {@link PremiumFeatureDirective}; nothing else should reach for it.
 *
 * The badge sits OUTSIDE the region `disableFocusableElements` covers, and has
 * to: that directive disables every focusable descendant, so a badge inside it
 * would be unreachable — taking the explanation of the lock down with it.
 */
@Component({
  selector: 'ix-premium-feature-wrapper',
  templateUrl: './premium-feature-wrapper.component.html',
  styleUrls: ['./premium-feature-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DisableFocusableElementsDirective,
    NgTemplateOutlet,
    PremiumBadgeComponent,
  ],
})
export class PremiumFeatureWrapperComponent {
  readonly template = input.required<TemplateRef<HTMLElement>>();
  readonly testId = input<TnTestIdValue>(undefined);

  /**
   * The library's tooltip triggers on `tn-form-field [tooltip]` and `tn-form-section [tooltip]`.
   * They stay operable inside the locked region: the point of leaving a denied feature on screen
   * is that an administrator can read what it does, and the library pins its tooltips — they open
   * on a click of that button and on nothing else, so disabling it withholds the explanation.
   */
  protected readonly keepFocusable = '.tn-form-field-tooltip, .tn-form-section__tooltip';
}

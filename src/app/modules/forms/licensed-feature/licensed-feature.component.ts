import {
  ChangeDetectionStrategy, Component, computed, contentChild, input,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { TnIconComponent, TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';

/**
 * Wraps a control gated behind a license or licensed hardware, inside its `tn-form-field` (leave the
 * field's `tooltip` unset), e.g. `<ix-licensed-feature [locked]="form.controls.rdma.disabled" [tooltip]="...">`.
 * Unlocked, it shows a `?` help icon with `tooltip`; locked, a key icon, and hovering the disabled control
 * shows the same text, so users needn't click to learn why it's disabled.
 */
@Component({
  selector: 'ix-licensed-feature',
  templateUrl: './licensed-feature.component.html',
  styleUrls: ['./licensed-feature.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent, TnTestIdDirective, TnTooltipDirective],
})
export class LicensedFeatureComponent {
  readonly locked = input(false);

  /** Help text for the feature. Shown on the `?` when unlocked and, by default, on the key when locked. */
  readonly tooltip = input('');

  /** Why the feature is locked, when that differs from `tooltip`. */
  readonly lockedTooltip = input('');

  protected readonly lockedMessage = computed(() => this.lockedTooltip() || this.tooltip());

  private readonly control = contentChild(NgControl);

  /** Keyed off the gated control's name, so several gated fields on one form stay distinct. */
  protected readonly keyTestId = computed(() => ['licensed-feature', this.controlName(), 'key']);
  protected readonly helpTestId = computed(() => ['licensed-feature', this.controlName(), 'help']);

  private readonly controlName = computed(() => String(this.control()?.name ?? ''));
}

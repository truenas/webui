import {
  ChangeDetectionStrategy, Component, computed, contentChild, input,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { TnIconComponent, TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';

/**
 * Standard presentation for a form control gated behind a license (Enterprise, HA) or
 * licensed hardware. Wrap the control inside its `tn-form-field` (leave the field's own
 * `tooltip` unset — this component renders the help icon instead):
 *
 * ```html
 * <tn-form-field>
 *   <ix-licensed-feature [locked]="form.controls.rdma.disabled" [tooltip]="helptext.rdma | translate">
 *     <tn-checkbox formControlName="rdma" [label]="'Enable RDMA' | translate"></tn-checkbox>
 *   </ix-licensed-feature>
 * </tn-form-field>
 * ```
 *
 * - Unlocked: a regular `?` help icon with `tooltip` (none when `tooltip` is empty).
 * - Locked: a key icon instead of the `?`, and hovering the disabled control shows the same
 *   text as the key, so users never have to click to learn why the control is disabled.
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

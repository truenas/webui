import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TnTooltipDirective } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

export enum VmwareSnapshotStatus {
  Pending = 'PENDING',
  Error = 'ERROR',
  Success = 'SUCCESS',
  Blocked = 'BLOCKED',
}

export interface VmwareState {
  state: VmwareSnapshotStatus;
  error?: string;
  datetime?: { $time: number };
}

/**
 * Read-only status pill for the VMware snapshot list. Previously a permanently
 * `disabled` `<button mat-stroked-button>`; the library has no multi-colour
 * status pill (`tn-button` only does filled/outline, `tn-chip` only
 * primary/secondary/accent), so this is a plain `<span>` styled locally — which
 * also drops the misleading "dimmed button" announcement of the disabled button.
 */
@Component({
  selector: 'ix-vmware-status-cell',
  templateUrl: './vmware-status-cell.component.html',
  styleUrls: ['./vmware-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTooltipDirective],
  providers: [TitleCasePipe],
})
export class VmwareStatusCellComponent {
  private translate = inject(TranslateService);
  private titleCase = inject(TitleCasePipe);

  readonly state = input.required<VmwareState>();

  /**
   * The pill's visible text, and the whole of its accessible name for the states that need
   * no explanation — so status is never conveyed by colour alone.
   *
   * `translated` rather than a plain `computed`: these were `| translate` bindings before the
   * migration, so they have to keep following a language change.
   */
  protected readonly stateText = translated<string>(
    () => this.titleCase.transform(this.translate.instant(this.state().state)),
  );

  protected readonly tooltip = translated<string>(() => {
    const status = this.state().state;

    if (status === VmwareSnapshotStatus.Error) {
      const error = this.state().error;
      return error ? this.translate.instant(error) : this.translate.instant('Error');
    }

    if (status === VmwareSnapshotStatus.Blocked) {
      return this.translate.instant('Blocked due to outbound network restrictions');
    }

    if (status === VmwareSnapshotStatus.Pending) {
      return this.translate.instant('Pending');
    }

    return this.translate.instant('Success');
  });

  /**
   * The tooltip text for the states whose tooltip says more than the pill does, so it can be
   * appended for screen readers. Empty for the rest, where the tooltip only repeats the
   * visible word.
   */
  protected readonly explanation = computed<string>(() => {
    const tooltip = this.tooltip();
    // Compared against the visible word rather than gated on the state, so a bare
    // ERROR (whose tooltip falls back to "Error") doesn't announce "Error, Error".
    return tooltip === this.stateText() ? '' : tooltip;
  });

  protected readonly stateClass = computed<string>(() => {
    switch (this.state().state) {
      case VmwareSnapshotStatus.Success:
        return 'state-green';
      case VmwareSnapshotStatus.Pending:
        return 'state-orange';
      case VmwareSnapshotStatus.Error:
        return 'state-red';
      case VmwareSnapshotStatus.Blocked:
        return 'state-yellow';
      default:
        return 'state-primary';
    }
  });
}

import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnTooltipDirective } from '@truenas/ui-components';

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
  imports: [TnTooltipDirective, TranslateModule, TitleCasePipe],
})
export class VmwareStatusCellComponent {
  private translate = inject(TranslateService);

  readonly state = input.required<VmwareState>();
  /** Row description the state is folded into, so status isn't conveyed by colour alone. */
  readonly rowLabel = input<string>('');

  protected readonly tooltip = computed<string>(() => {
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

  protected readonly ariaLabel = computed<string>(() => {
    const status = this.state().state;
    const stateText = this.translate.instant(status);
    // ERROR/BLOCKED carry their explanation only in the tooltip, which is unreachable
    // on a non-focusable element — fold it into the accessible name instead.
    const isExplained = status === VmwareSnapshotStatus.Error || status === VmwareSnapshotStatus.Blocked;
    return [this.rowLabel(), stateText, isExplained ? this.tooltip() : '']
      .filter(Boolean)
      .join(', ');
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

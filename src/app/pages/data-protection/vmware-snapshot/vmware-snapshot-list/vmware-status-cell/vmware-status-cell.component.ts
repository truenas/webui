import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

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

@Component({
  selector: 'ix-vmware-status-cell',
  templateUrl: './vmware-status-cell.component.html',
  styleUrls: ['./vmware-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatTooltip, NgClass, TranslateModule],
})
export class VmwareStatusCellComponent {
  private translate = inject(TranslateService);

  readonly state = input.required<VmwareState>();

  get tooltip(): string {
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
  }

  protected getButtonClass(): string {
    const status = this.state().state;

    switch (status) {
      case VmwareSnapshotStatus.Success:
        return 'fn-theme-green';
      case VmwareSnapshotStatus.Pending:
        return 'fn-theme-orange';
      case VmwareSnapshotStatus.Error:
        return 'fn-theme-red';
      case VmwareSnapshotStatus.Blocked:
        return 'fn-theme-yellow';
      default:
        return 'fn-theme-primary';
    }
  }
}

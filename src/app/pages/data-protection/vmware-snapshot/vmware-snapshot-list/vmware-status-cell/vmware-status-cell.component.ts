import {
  ChangeDetectionStrategy,
  Component, HostBinding, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

export enum VmwareSnapshotStatus {
  Pending = 'PENDING',
  Error = 'ERROR',
  Success = 'SUCCESS',
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
  standalone: true,
  imports: [MatTooltip, TranslateModule],
})
export class VmwareStatusCellComponent {
  readonly state = input.required<VmwareState>();

  get tooltip(): string {
    if (this.state().state === VmwareSnapshotStatus.Error) {
      const error = this.state().error;
      return error ? this.translate.instant(error) : this.translate.instant('Error');
    }
    return this.state().state === VmwareSnapshotStatus.Pending
      ? this.translate.instant('Pending')
      : this.translate.instant('Success');
  }

  @HostBinding('class') get hostClasses(): string[] {
    return ['status', this.state()?.state.toLowerCase()];
  }

  constructor(private translate: TranslateService) { }
}

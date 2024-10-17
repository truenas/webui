import {
  ChangeDetectionStrategy,
  Component, HostBinding, Input,
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
  @Input() state: VmwareState;

  get tooltip(): string {
    if (this.state.state === VmwareSnapshotStatus.Error) {
      return this.state.error ? this.translate.instant(this.state.error) : this.translate.instant('Error');
    }
    return this.state.state === VmwareSnapshotStatus.Pending
      ? this.translate.instant('Pending')
      : this.translate.instant('Success');
  }

  @HostBinding('class') get hostClasses(): string[] {
    return ['status', this.state?.state.toLowerCase()];
  }

  constructor(private translate: TranslateService) { }
}

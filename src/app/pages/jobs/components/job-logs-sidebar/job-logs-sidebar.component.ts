import {
  Component, ChangeDetectionStrategy, EventEmitter, Input, Output,
} from '@angular/core';
import { JobViewLogState } from 'app/enums/job-view-log-state.enum';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-job-logs-sidebar',
  templateUrl: './job-logs-sidebar.component.html',
  styleUrls: ['./job-logs-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobLogsSidebarComponent {
  @Input() job: Job;
  @Input() viewType: JobViewLogState;
  @Output() closed = new EventEmitter<void>();

  readonly JobViewLogState = JobViewLogState;

  onCloseClicked(): void {
    this.closed.emit();
  }
}

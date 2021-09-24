import {
  Component, ChangeDetectionStrategy, EventEmitter, Input, Output,
} from '@angular/core';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'app-job-logs-sidebar',
  templateUrl: './job-logs-sidebar.component.html',
  styleUrls: ['./job-logs-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobLogsSidebarComponent {
  @Input() job: Job;
  @Output() closed = new EventEmitter<void>();

  onCloseClicked(): void {
    this.closed.emit();
  }
}

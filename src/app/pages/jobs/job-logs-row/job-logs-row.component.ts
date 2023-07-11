import {
  ChangeDetectionStrategy,
  Component, Input,
} from '@angular/core';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-job-logs-row',
  templateUrl: './job-logs-row.component.html',
  styleUrls: ['./job-logs-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobLogsRowComponent {
  @Input() job: Job;
  @Input() colspan: number;
}

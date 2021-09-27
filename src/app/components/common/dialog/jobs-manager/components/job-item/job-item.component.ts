import {
  Component, Input, Output, EventEmitter,
} from '@angular/core';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'app-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
  providers: [FormatDateTimePipe],
})
export class JobItemComponent {
  @Input() job: Job;
  @Output() aborted = new EventEmitter();
  @Output() opened = new EventEmitter();
  readonly JobState = JobState;

  abort(): void {
    this.aborted.emit();
  }

  open(): void {
    this.opened.emit();
  }
}

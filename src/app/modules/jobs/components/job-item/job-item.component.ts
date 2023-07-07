import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobItemComponent {
  @Input() job: Job;
  @Input() clickable = false;
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

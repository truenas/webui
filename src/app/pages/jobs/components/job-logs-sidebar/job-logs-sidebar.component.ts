import {
  Component, ChangeDetectionStrategy, EventEmitter, Input, Output, ChangeDetectorRef, OnChanges,
} from '@angular/core';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'app-job-logs-sidebar',
  templateUrl: './job-logs-sidebar.component.html',
  styleUrls: ['./job-logs-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobLogsSidebarComponent implements OnChanges {
  @Input() job: Job;
  @Input() viewType: string;
  @Output() closed = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    const argument = document.getElementById('argument') as HTMLInputElement;
    if (argument) {
      argument.textContent = JSON.stringify(this.job.arguments, undefined, 2);
    }
    this.cdr.markForCheck();
  }

  onCloseClicked(): void {
    this.closed.emit();
  }
}

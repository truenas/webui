import {
  Component, ChangeDetectionStrategy, input, output,
} from '@angular/core';
import { JobState } from 'app/enums/job-state.enum';
import { getCredentialsCreationSource } from 'app/helpers/get-credentials-creation-source.utils';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobItemComponent {
  readonly job = input.required<Job>();
  readonly clickable = input(false);

  readonly aborted = output();
  readonly opened = output();

  readonly JobState = JobState;
  readonly credentialTypeLabels = credentialTypeLabels;
  readonly getCredentialsCreationSource = getCredentialsCreationSource;

  abort(): void {
    this.aborted.emit();
  }

  open(): void {
    this.opened.emit();
  }
}

import {
  ChangeDetectionStrategy,
  Component, Input,
} from '@angular/core';
import { getCredentialsCreationSource } from 'app/helpers/get-credentials-creation-source.utils';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';
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

  readonly credentialTypeLabels = credentialTypeLabels;
  readonly getCredentialsCreationSource = getCredentialsCreationSource;
}

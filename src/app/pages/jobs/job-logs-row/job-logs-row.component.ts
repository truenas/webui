import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, Input,
} from '@angular/core';
import { json } from '@codemirror/lang-json';
import { TranslateModule } from '@ngx-translate/core';
import { getCredentialsCreationSource } from 'app/helpers/get-credentials-creation-source.utils';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-job-logs-row',
  templateUrl: './job-logs-row.component.html',
  styleUrls: ['./job-logs-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CopyButtonComponent,
    TranslateModule,
    MapValuePipe,
    JsonPipe,
  ],
})
export class JobLogsRowComponent {
  @Input() job: Job;

  readonly credentialTypeLabels = credentialTypeLabels;
  readonly getCredentialsCreationSource = getCredentialsCreationSource;
  protected readonly json = json;
}

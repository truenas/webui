import { DecimalPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input, output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { getCredentialsCreationSource } from 'app/helpers/get-credentials-creation-source.utils';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Job } from 'app/interfaces/job.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltip,
    MatProgressBar,
    MatIconButton,
    IxIconComponent,
    TranslateModule,
    FormatDateTimePipe,
    MapValuePipe,
    DecimalPipe,
    TestDirective,
  ],
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

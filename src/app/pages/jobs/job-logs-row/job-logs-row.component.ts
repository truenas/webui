import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, computed, input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { getCredentialsCreationSource } from 'app/helpers/get-credentials-creation-source.utils';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-job-logs-row',
  templateUrl: './job-logs-row.component.html',
  styleUrls: ['./job-logs-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CopyButtonComponent,
    TranslateModule,
    MapValuePipe,
    JsonPipe,
    ReactiveFormsModule,
    IxCodeEditorComponent,
  ],
})
export class JobLogsRowComponent {
  readonly job = input.required<Job>();

  readonly credentialTypeLabels = credentialTypeLabels;
  readonly getCredentialsCreationSource = getCredentialsCreationSource;
  protected readonly CodeEditorLanguage = CodeEditorLanguage;

  protected readonly argumentsControl = computed(() => {
    return new FormControl({ value: JSON.stringify(this.job().arguments, null, 2), disabled: true });
  });
}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import {
  SchedulerDateExamplesComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-date-examples/scheduler-date-examples.component';
import {
  SchedulerModalComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.component';
import {
  SchedulerPreviewColumnComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-preview-column/scheduler-preview-column.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    TooltipModule,
    IxFormsModule,
    FormsModule,
    MatSelectModule,
    MatDatepickerModule,
    IxIconModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    CoreComponents,
    TestIdModule,
  ],
  exports: [
    SchedulerComponent,
    CrontabExplanationPipe,
  ],
  declarations: [
    SchedulerComponent,
    SchedulerModalComponent,
    SchedulerPreviewColumnComponent,
    SchedulerDateExamplesComponent,
    CrontabExplanationPipe,
  ],
})
export class SchedulerModule {
}

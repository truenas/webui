import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { IxDateComponent } from 'app/modules/pipes/ix-date/ix-date.component';
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
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    IxDateComponent,
    FormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    IxIconModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    TestIdModule,
    TooltipComponent,
    CastPipe,
    IxSelectComponent,
    IxInputComponent,
    IxLabelComponent,
    IxErrorsComponent,
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

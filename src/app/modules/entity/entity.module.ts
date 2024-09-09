import { DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { TranslateModule } from '@ngx-translate/core';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    MatDialogModule,
    MatProgressBarModule,
    MatButtonModule,
    TestIdModule,
    IxIconModule,
    TranslateModule,
    MatSliderModule,
    DecimalPipe,
  ],
  declarations: [
    EntityJobComponent,
  ],
})
export class EntityModule { }

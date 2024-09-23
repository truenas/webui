import { DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { TranslateModule } from '@ngx-translate/core';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@NgModule({
  imports: [
    MatDialogModule,
    MatProgressBarModule,
    MatButtonModule,
    IxIconComponent,
    TranslateModule,
    MatSliderModule,
    DecimalPipe,
    TestDirective,
  ],
  declarations: [
    EntityJobComponent,
  ],
})
export class EntityModule { }

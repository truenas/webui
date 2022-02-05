import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { JobItemComponent } from 'app/components/common/dialog/jobs-manager/components/job-item/job-item.component';
import { JobsManagerComponent } from 'app/components/common/dialog/jobs-manager/jobs-manager.component';
import { CoreComponents } from 'app/core/core-components.module';
import { EntityModule } from 'app/modules/entity/entity.module';

@NgModule({
  exports: [JobsManagerComponent, JobItemComponent],
  declarations: [JobsManagerComponent, JobItemComponent],
  imports: [
    CoreComponents,
    CommonModule,
    EntityModule,
    RouterModule,
    TranslateModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
})
export class JobsManagerModule {}

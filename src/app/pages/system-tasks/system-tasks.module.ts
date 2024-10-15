import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { ConfigResetComponent } from 'app/pages/system-tasks/config-reset/config-reset.component';
import { FailoverComponent } from 'app/pages/system-tasks/failover/failover.component';
import { RestartComponent } from 'app/pages/system-tasks/restart/restart.component';
import { ShutdownComponent } from 'app/pages/system-tasks/shutdown/shutdown.component';
import { systemTasksRoutes } from 'app/pages/system-tasks/system-tasks.routing';

@NgModule({
  imports: [
    MatListModule,
    IxIconComponent,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatGridListModule,
    TranslateModule,
    RouterModule.forChild(systemTasksRoutes),
    CopyrightLineComponent,
    RestartComponent, FailoverComponent, ShutdownComponent, ConfigResetComponent,
  ],
})
export class SystemTasksModule { }

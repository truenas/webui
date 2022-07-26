import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { ConfigResetComponent } from './config-reset/config-reset.component';
import { FailoverComponent } from './failover/failover.component';
import { othersRoutes } from './others.routing';
import { RebootComponent } from './reboot/reboot.component';
import { ShutdownComponent } from './shutdown/shutdown.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    IxIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatGridListModule,
    FlexLayoutModule,
    TranslateModule,
    RouterModule.forChild(othersRoutes),
    CoreComponents,
  ],
  declarations: [RebootComponent, FailoverComponent, ShutdownComponent, ConfigResetComponent],
})
export class OthersModule { }

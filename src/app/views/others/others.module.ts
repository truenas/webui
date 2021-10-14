import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { ConfigResetComponent } from './config-reset/config-reset.component';
import { FailoverComponent } from './failover/failover.component';
import { OthersRoutes } from './others.routing';
import { RebootComponent } from './reboot/reboot.component';
import { ShutdownComponent } from './shutdown/shutdown.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatGridListModule,
    FlexLayoutModule,
    TranslateModule,
    RouterModule.forChild(OthersRoutes),
    CoreComponents,
  ],
  declarations: [RebootComponent, FailoverComponent, ShutdownComponent, ConfigResetComponent],
})
export class OthersModule { }

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  MatListModule,
  MatIconModule,
  MatButtonModule,
  MatCardModule,
  MatMenuModule,
  MatSlideToggleModule,
  MatGridListModule
 } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppBlankComponent } from './app-blank/app-blank.component';
import { OthersRoutes } from "./others.routing";
import { FailoverComponent } from "./failover/failover.component";
import { RebootComponent } from "./reboot/reboot.component";
import { ShutdownComponent } from "./shutdown/shutdown.component";
import { TranslateModule } from '@ngx-translate/core';

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
    RouterModule.forChild(OthersRoutes)
  ],
  declarations: [AppBlankComponent, RebootComponent, FailoverComponent, ShutdownComponent]
})
export class OthersModule { }

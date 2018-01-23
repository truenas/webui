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
import { RebootComponent } from "./reboot/reboot.component";
import { ShutdownComponent } from "./shutdown/shutdown.component";

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
    RouterModule.forChild(OthersRoutes)
  ],
  declarations: [AppBlankComponent, RebootComponent, ShutdownComponent]
})
export class OthersModule { }

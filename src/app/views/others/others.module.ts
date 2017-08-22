import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  MdListModule,
  MdIconModule,
  MdButtonModule,
  MdCardModule,
  MdMenuModule,
  MdSlideToggleModule,
  MdGridListModule
 } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppBlankComponent } from './app-blank/app-blank.component';
import { OthersRoutes } from "./others.routing";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdListModule,
    MdIconModule,
    MdButtonModule,
    MdCardModule,
    MdMenuModule,
    MdSlideToggleModule,
    MdGridListModule,
    FlexLayoutModule,
    RouterModule.forChild(OthersRoutes)
  ],
  declarations: [AppBlankComponent]
})
export class OthersModule { }

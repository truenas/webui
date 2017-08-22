import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  MdDialogModule,
  MdProgressSpinnerModule
 } from '@angular/material';

import { AppLoaderService } from './app-loader.service';
import { AppLoaderComponent } from './app-loader.component';

@NgModule({
  imports: [
    CommonModule,
    MdDialogModule,
    MdProgressSpinnerModule
  ],
  providers: [AppLoaderService],
  declarations: [AppLoaderComponent],
  entryComponents: [AppLoaderComponent]
})
export class AppLoaderModule { }

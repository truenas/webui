import { AppConfirmService } from './app-confirm.service';
import { 
  MdDialogModule,
  MdButtonModule
 } from '@angular/material';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppComfirmComponent } from './app-confirm.component';

@NgModule({
  imports: [
    MdDialogModule,
    MdButtonModule,
    FlexLayoutModule
  ],
  exports: [AppComfirmComponent],
  declarations: [AppComfirmComponent],
  providers: [AppConfirmService],
  entryComponents: [AppComfirmComponent]
})
export class AppConfirmModule { }
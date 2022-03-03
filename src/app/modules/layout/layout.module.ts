import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    IxFormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ChangePasswordDialogComponent,
  ],
  exports: [
    ChangePasswordDialogComponent,
  ],
})
export class LayoutModule {}

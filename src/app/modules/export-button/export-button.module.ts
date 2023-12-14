import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ExportButtonComponent } from 'app/modules/export-button/components/export-button/export-button.component';

@NgModule({
  declarations: [ExportButtonComponent],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
  ],
  exports: [
    ExportButtonComponent,
  ],
})
export class ExportButtonModule { }

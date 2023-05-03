import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { OrderedListboxComponent } from './ordered-list.component';

@NgModule({
  declarations: [OrderedListboxComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    IxIconModule,
    IxFormsModule,
    DragDropModule,
    TestIdModule,
    MatSlideToggleModule,
  ],
  exports: [OrderedListboxComponent],
})
export class NgxOrderedListboxModule {}

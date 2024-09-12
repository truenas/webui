import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { DualListboxComponent } from 'app/modules/lists/dual-list/dual-list.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  declarations: [DualListboxComponent],
  imports: [
    MatButtonModule,
    MatListModule,
    IxIconModule,
    DragDropModule,
    TestIdModule,
    NgTemplateOutlet,
  ],
  exports: [DualListboxComponent],
})
export class DualListModule {}

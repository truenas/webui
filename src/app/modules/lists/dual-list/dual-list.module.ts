import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DualListboxComponent } from 'app/modules/lists/dual-list/dual-list.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@NgModule({
  declarations: [DualListboxComponent],
  imports: [
    MatButtonModule,
    MatListModule,
    IxIconComponent,
    DragDropModule,
    NgTemplateOutlet,
    TestDirective,
  ],
  exports: [DualListboxComponent],
})
export class DualListModule {}

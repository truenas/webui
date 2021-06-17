import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { DualListboxComponent } from './dual-list.component';

@NgModule({
  declarations: [DualListboxComponent],
  imports: [CommonModule, MatButtonModule, MatListModule, MatIconModule, DragDropModule],
  exports: [DualListboxComponent],
})
export class NgxDualListboxModule {}

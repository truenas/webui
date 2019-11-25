import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DualListboxComponent } from './dual-list.component';
import { MatButtonModule, MatListModule, MatIconModule } from '@angular/material';
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [DualListboxComponent],
  imports: [CommonModule, MatButtonModule, MatListModule, MatIconModule, DragDropModule],
  exports: [DualListboxComponent]
})
export class NgxDualListboxModule {}

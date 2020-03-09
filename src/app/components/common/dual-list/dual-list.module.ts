import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DualListboxComponent } from './dual-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import {DragDropModule} from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [DualListboxComponent],
  imports: [CommonModule, MatButtonModule, MatListModule, MatIconModule, DragDropModule],
  exports: [DualListboxComponent]
})
export class NgxDualListboxModule {}

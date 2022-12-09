import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { DualListboxComponent } from './dual-list.component';

@NgModule({
  declarations: [DualListboxComponent],
  imports: [CommonModule, MatButtonModule, MatListModule, IxIconModule, DragDropModule],
  exports: [DualListboxComponent],
})
export class NgxDualListboxModule {}

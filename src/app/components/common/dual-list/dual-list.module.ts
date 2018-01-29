import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DualListboxComponent } from './dual-list.component';
import { MatButtonModule, MatListModule, MatIconModule } from '@angular/material';

@NgModule({
  declarations: [DualListboxComponent],
  imports: [CommonModule, MatButtonModule, MatListModule, MatIconModule],
  exports: [DualListboxComponent]
})
export class NgxDualListboxModule {}

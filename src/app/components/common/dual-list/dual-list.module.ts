import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DualListboxComponent} from './dual-list.component';
import {MdButtonModule, MdListModule, MdIconModule} from '@angular/material';

@NgModule({
  declarations: [DualListboxComponent],
  imports: [CommonModule, MdButtonModule, MdListModule, MdIconModule],
  exports: [DualListboxComponent]
})
export class NgxDualListboxModule {
}

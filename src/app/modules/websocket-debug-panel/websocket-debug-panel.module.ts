import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  NgClass, NgFor, AsyncPipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@NgModule({
  declarations: [],
  imports: [
    NgClass,
    NgFor,
    AsyncPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    IxIconComponent,
    MatTabsModule,
    MatSlideToggleModule,
    ScrollingModule,
  ],
  exports: [],
})
export class WebSocketDebugPanelModule { }

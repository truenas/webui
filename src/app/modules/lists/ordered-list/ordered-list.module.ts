import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  declarations: [OrderedListboxComponent],
  imports: [
    MatButtonModule,
    MatListModule,
    IxIconModule,
    DragDropModule,
    TestIdModule,
    MatSlideToggleModule,
    TranslateModule,
    IxLabelComponent,
    IxErrorsComponent,
  ],
  exports: [OrderedListboxComponent],
})
export class NgxOrderedListboxModule {}

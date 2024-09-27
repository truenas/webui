import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@NgModule({
  declarations: [OrderedListboxComponent],
  imports: [
    MatButtonModule,
    MatListModule,
    IxIconComponent,
    DragDropModule,
    MatSlideToggleModule,
    TranslateModule,
    IxLabelComponent,
    IxErrorsComponent,
    TestDirective,
  ],
  exports: [OrderedListboxComponent],
})
export class NgxOrderedListboxModule {}

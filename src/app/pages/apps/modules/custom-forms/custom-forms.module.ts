import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FilterSelectListComponent } from 'app/pages/apps/modules/custom-forms/components/filter-select-list/filter-select-list.component';

@NgModule({
  imports: [
    IxIconComponent,
    TranslateModule,
    IxErrorsComponent,
    AsyncPipe,
  ],
  declarations: [
    FilterSelectListComponent,
  ],
  exports: [
    FilterSelectListComponent,
  ],
})
export class CustomFormsModule { }

import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule, NgIf } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { UiSearchComponent } from './components/ui-search/ui-search.component';
import { UiSearchResultsComponent } from './components/ui-search-results/ui-search-results.component';

@NgModule({
  declarations: [
    UiSearchComponent,
    UiSearchResultsComponent,
  ],
  imports: [
    CommonModule,
    IxIconModule,
    MatInputModule,
    NgIf,
    TestIdModule,
    TranslateModule,
    MatDialogModule,
    ReactiveFormsModule,
    IxFormsModule,
    MatCardModule,
    OverlayModule,
  ],
  exports: [UiSearchComponent],
})
export class GlobalUiSearchModule { }

import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule, NgIf } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { GlobalSearchTriggerComponent } from 'app/modules/global-search/components/global-search-trigger/global-search-trigger.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { KeyboardShortcutComponent } from 'app/modules/keyboard-shortcut/keyboard-shortcut.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  declarations: [
    GlobalSearchComponent,
    GlobalSearchResultsComponent,
    GlobalSearchTriggerComponent,
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
    A11yModule,
    EmptyComponent,
    MatButtonModule,
    KeyboardShortcutComponent,
  ],
  exports: [GlobalSearchComponent, GlobalSearchTriggerComponent],
})
export class GlobalSearchModule { }

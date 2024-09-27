import { NgClass } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruecommandConnectModalComponent } from 'app/modules/truecommand/components/truecommand-connect-modal/truecommand-connect-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal/truecommand-status-modal.component';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';
import { TruecommandSignupModalComponent } from './components/truecommand-signup-modal/truecommand-signup-modal.component';

@NgModule({
  declarations: [
    TruecommandButtonComponent,
    TruecommandStatusModalComponent,
    TruecommandConnectModalComponent,
    TruecommandSignupModalComponent,
  ],
  exports: [
    TruecommandButtonComponent,
  ],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    IxIconComponent,
    MatBadgeModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    IxInputComponent,
    IxCheckboxComponent,
    NgClass,
    RequiresRolesDirective,
    FormActionsComponent,
    UiSearchDirective,
    TestDirective,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class TruecommandModule { }

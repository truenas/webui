import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TruecommandConnectModalComponent } from 'app/modules/truecommand/components/truecommand-connect-modal/truecommand-connect-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal/truecommand-status-modal.component';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';
import { TruecommandSignupModalComponent } from './components/truecommand-signup-modal/truecommand-signup-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    CommonDirectivesModule,
    TranslateModule,
    IxIconModule,
    MatBadgeModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
    IxFormsModule,
    HttpClientModule,
    MatDialogModule,
  ],
  declarations: [
    TruecommandButtonComponent,
    TruecommandStatusModalComponent,
    TruecommandConnectModalComponent,
    TruecommandSignupModalComponent,
  ],
  exports: [
    TruecommandButtonComponent,
  ],
})
export class TruecommandModule { }

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TruecommandSignupModalComponent } from 'app/modules/truecommand/components/truecommand-signup-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal.component';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';

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
  ],
  declarations: [
    TruecommandButtonComponent,
    TruecommandStatusModalComponent,
    TruecommandSignupModalComponent,
  ],
  exports: [
    TruecommandButtonComponent,
  ],
})
export class TruecommandModule { }

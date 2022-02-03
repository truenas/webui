import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { TruecommandSignupModalComponent } from 'app/modules/truecommand/components/truecommand-signup-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal.component';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    CommonDirectivesModule,
    TranslateModule,
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
  entryComponents: [
    TruecommandStatusModalComponent,
    TruecommandSignupModalComponent,
  ],
})
export class TruecommandModule { }

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CredentialsSelectComponent } from 'app/modules/custom-selects/credentials-select/credentials-select.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';

@NgModule({
  imports: [
    IxFormsModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  declarations: [
    CredentialsSelectComponent,
  ],
  exports: [
    CredentialsSelectComponent,
  ],
})
export class CredentialsSelectModule { }

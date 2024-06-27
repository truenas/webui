import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';

@NgModule({
  imports: [
    IxFormsModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  declarations: [
    CloudCredentialsSelectComponent,
  ],
  exports: [
    CloudCredentialsSelectComponent,
  ],
})
export class CloudCredentialsSelectModule { }

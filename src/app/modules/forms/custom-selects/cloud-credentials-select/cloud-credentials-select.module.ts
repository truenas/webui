import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IxSelectComponent,
  ],
  declarations: [
    CloudCredentialsSelectComponent,
  ],
  exports: [
    CloudCredentialsSelectComponent,
  ],
})
export class CloudCredentialsSelectModule { }

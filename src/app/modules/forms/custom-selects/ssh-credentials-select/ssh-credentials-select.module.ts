import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IxSelectComponent,
  ],
  declarations: [
    SshCredentialsSelectComponent,
  ],
  exports: [
    SshCredentialsSelectComponent,
  ],
})
export class SshCredentialsSelectModule { }

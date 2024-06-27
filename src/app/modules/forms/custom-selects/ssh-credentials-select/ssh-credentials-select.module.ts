import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';

@NgModule({
  imports: [
    IxFormsModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  declarations: [
    SshCredentialsSelectComponent,
  ],
  exports: [
    SshCredentialsSelectComponent,
  ],
})
export class SshCredentialsSelectModule { }

import { NgModule } from '@angular/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { TwoFactorAuthFormComponent } from 'app/pages/two-factor-auth/components/two-factor-auth-form/two-factor-auth-form.component';
import { routing } from 'app/pages/two-factor-auth/two-factor-auth.routing';

@NgModule({
  imports: [
    IxFormsModule,
    routing,
  ],
  declarations: [
    TwoFactorAuthFormComponent,
  ],
})
export default class TwoFactorAuthModule { }

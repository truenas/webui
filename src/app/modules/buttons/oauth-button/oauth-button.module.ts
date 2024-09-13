import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/components/oauth-button/oauth-button.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  declarations: [
    OauthButtonComponent,
  ],
  imports: [
    TranslateModule,
    MatButtonModule,
    TestIdModule,
  ],
  exports: [
    OauthButtonComponent,
  ],
})
export class OauthButtonModule { }

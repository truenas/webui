import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/components/oauth-button/oauth-button.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@NgModule({
  declarations: [
    OauthButtonComponent,
  ],
  imports: [
    TranslateModule,
    MatButtonModule,
    TestDirective,
  ],
  exports: [
    OauthButtonComponent,
  ],
})
export class OauthButtonModule { }

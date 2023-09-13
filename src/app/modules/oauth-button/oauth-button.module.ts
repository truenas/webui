import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { OauthButtonComponent } from './components/oauth-button/oauth-button.component';

@NgModule({
  declarations: [
    OauthButtonComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    TestIdModule,
  ],
  exports: [
    OauthButtonComponent,
  ],
})
export class OauthButtonModule { }

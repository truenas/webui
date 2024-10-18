import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { QrCodeModule } from 'ng-qrcode';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { IxWarningComponent } from 'app/modules/forms/ix-forms/components/ix-warning/ix-warning.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { QrViewerComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-viewer/qr-viewer.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';
import { routing } from 'app/pages/two-factor-auth/two-factor-auth.routing';

@NgModule({
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    NgxSkeletonLoaderModule,
    MatToolbarModule,
    TranslateModule,
    QrCodeModule,
    routing,
    IxWarningComponent,
    AsyncPipe,
    UiSearchDirective,
    TestDirective,
    CopyButtonComponent,
  ],
  declarations: [
    TwoFactorComponent,
    QrViewerComponent,
  ],
})
export class TwoFactorAuthModule { }

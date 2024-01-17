import { CommonModule } from '@angular/common';
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
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { QrViewerComponent } from 'app/pages/two-factor-auth/components/two-factor/qr-viewer/qr-viewer.component';
import { TwoFactorComponent } from 'app/pages/two-factor-auth/components/two-factor/two-factor.component';
import { routing } from 'app/pages/two-factor-auth/two-factor-auth.routing';

@NgModule({
  imports: [
    IxFormsModule,
    ReactiveFormsModule,
    CommonModule,
    AppLoaderModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    NgxSkeletonLoaderModule,
    MatToolbarModule,
    TranslateModule,
    TestIdModule,
    QrCodeModule,
    routing,
  ],
  declarations: [
    TwoFactorComponent,
    QrViewerComponent,
  ],
})
export class TwoFactorAuthModule { }

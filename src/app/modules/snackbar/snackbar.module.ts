import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    IxIconModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule,
    MatSnackBarModule,
    TestIdModule,
  ],
  exports: [],
  declarations: [
    SnackbarComponent,
  ],
  providers: [
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        verticalPosition: 'top',
        duration: 3000,
      } as MatSnackBarConfig,
    },
  ],
})
export class SnackbarModule {}

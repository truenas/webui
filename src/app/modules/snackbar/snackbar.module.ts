import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';

@NgModule({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule,
    CommonModule,
    MatSnackBarModule,
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

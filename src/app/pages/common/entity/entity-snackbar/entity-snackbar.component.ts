import { Component } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@UntilDestroy()
@Component({
  selector: 'app-entity-snackbar',
  templateUrl: './entity-snackbar.component.html',
  styleUrls: ['./entity-snackbar.component.scss'],
})
export class EntitySnackbarComponent {
  static message: string;
  static action: string;

  translatedMsg: string;
  action: string;

  constructor(private snackbar: MatSnackBar,
    protected translate: TranslateService,
    public snackBarRef: MatSnackBarRef<EntitySnackbarComponent>) {
    this.translate.get(EntitySnackbarComponent.message).pipe(untilDestroyed(this)).subscribe((res) => {
      this.translatedMsg = res;
    });
    this.action = EntitySnackbarComponent.action;
  }
}

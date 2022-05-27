import { Component } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';

@UntilDestroy()
@Component({
  templateUrl: './entity-snackbar.component.html',
  styleUrls: ['./entity-snackbar.component.scss'],
})
export class EntitySnackbarComponent {
  static message: string;
  static action: string;

  translatedMsg: string;
  action: string;

  constructor(
    protected translate: TranslateService,
    public snackBarRef: MatSnackBarRef<EntitySnackbarComponent>,
  ) {
    this.translatedMsg = this.translate.instant(EntitySnackbarComponent.message);
    this.action = EntitySnackbarComponent.action;
  }
}

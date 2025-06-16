import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  showConfirmDialog(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant('Unsaved Changes'),
      message: this.translate.instant('You have unsaved changes. Are you sure you want to close?'),
      cancelText: this.translate.instant('No'),
      buttonText: this.translate.instant('Yes'),
      buttonColor: 'warn',
      hideCheckbox: true,
    }).pipe(
      map((result) => Boolean(result)),
    );
  }
}

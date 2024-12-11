import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  defer, EMPTY, finalize, MonoTypeOperatorFunction, Observable,
} from 'rxjs';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { FocusService } from 'app/services/focus.service';

@Injectable({ providedIn: 'root' })
export class AppLoaderService {
  dialogRef: MatDialogRef<AppLoaderComponent>;

  constructor(
    private matDialog: MatDialog,
    private focusService: FocusService,
  ) { }

  /**
   * Opens loader when observable (request) starts and closes when it ends.
   */
  withLoader<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => defer(() => {
      this.open();
      return source$.pipe(
        finalize(() => this.close()),
      );
    });
  }

  open(title: string = T('Please wait')): Observable<boolean> {
    if (this.dialogRef !== undefined) {
      return EMPTY;
    }

    this.dialogRef = this.matDialog.open(AppLoaderComponent, {
      disableClose: false,
      width: '200px',
      height: '200px',
    });
    this.dialogRef.componentInstance.setTitle(title);
    return this.dialogRef.afterClosed();
  }

  close(): void {
    if (this.dialogRef) {
      this.tryToRestoreFocusToThePreviousDialog();
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  setTitle(title: string): void {
    if (!this.dialogRef) {
      return;
    }

    this.dialogRef.componentInstance.setTitle(title);
  }

  private tryToRestoreFocusToThePreviousDialog(): void {
    const previousDialogs = this.matDialog.openDialogs.filter((dialog) => dialog.id !== this.dialogRef.id);
    const previousDialogId = previousDialogs[previousDialogs.length - 1]?.id;

    if (previousDialogId) {
      this.focusService.focusElementById(previousDialogId);
    }
  }
}

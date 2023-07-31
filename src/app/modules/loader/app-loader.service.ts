import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  defer, EMPTY, finalize, MonoTypeOperatorFunction, Observable,
} from 'rxjs';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';

@Injectable({ providedIn: 'root' })
export class AppLoaderService {
  dialogRef: MatDialogRef<AppLoaderComponent>;

  constructor(private dialog: MatDialog) { }

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

    this.dialogRef = this.dialog.open(AppLoaderComponent, { disableClose: true });
    this.dialogRef.updateSize('200px', '200px');
    this.dialogRef.componentInstance.title = title;
    return this.dialogRef.afterClosed();
  }

  close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  setTitle(title: string): void {
    if (!this.dialogRef) {
      return;
    }

    this.dialogRef.componentInstance.title = title;
  }
}

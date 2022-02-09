import { EventEmitter, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Observable } from 'rxjs';
import { AppLoaderComponent } from 'app/modules/app-loader/app-loader.component';

@Injectable({ providedIn: 'root' })
export class AppLoaderService {
  dialogRef: MatDialogRef<AppLoaderComponent>;

  constructor(private dialog: MatDialog) { }

  /**
   *
   * @param title The title for the loading indicator
   * @param withProgress Set this to true if you intend to show a percentage
   * progress indicator while loading. You can update the progress percentage value
   * by emitting a new value through dialogRef.componentInstance.progressUpdater oberver
   * @returns An obervable to subscribe to for when the loader closes
   */
  open(title: string = T('Please wait'), withProgress: boolean = false): Observable<boolean> {
    if (this.dialogRef === undefined) {
      this.dialogRef = this.dialog.open(AppLoaderComponent, { disableClose: true });
      this.dialogRef.updateSize('200px', '200px');
    }
    this.dialogRef.componentInstance.title = title;
    if (withProgress) {
      this.dialogRef.componentInstance.withProgress();
    }
    return this.dialogRef.afterClosed();
  }

  close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  // These pass signals from various components to entity form component to start/stop progress spinner
  callStarted = new EventEmitter<string>();
  callDone = new EventEmitter<string>();
}

import { EventEmitter, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Rx';
import { AppLoaderComponent } from './app-loader.component';
import { T } from '../../translate-marker';

@Injectable()
export class AppLoaderService {
  dialogRef: MatDialogRef<AppLoaderComponent>;

  constructor(private dialog: MatDialog) { }

  public open(title: string = T('Please wait')): Observable<boolean> {
    this.dialogRef = this.dialog.open(AppLoaderComponent, {disableClose: true});
    this.dialogRef.updateSize('200px', '200px');
    this.dialogRef.componentInstance.title = title;
    return this.dialogRef.afterClosed();
  }

  public close() {
    this.dialogRef.close();
  }

  // These pass signals from various components to entity form component to start/stop progress spinner
  public callStarted = new EventEmitter<string>();
  public callDone = new EventEmitter<string>();
}

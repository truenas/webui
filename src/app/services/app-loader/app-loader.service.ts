import { Injectable } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Rx';
import { AppLoaderComponent } from './app-loader.component';

@Injectable()
export class AppLoaderService {
  dialogRef: MdDialogRef<AppLoaderComponent>;
  constructor(private dialog: MdDialog) { }

  public open(title: string = 'Please wait'): Observable<boolean> {
    this.dialogRef = this.dialog.open(AppLoaderComponent, {disableClose: true});
    this.dialogRef.updateSize('200px');
    this.dialogRef.componentInstance.title = title;
    return this.dialogRef.afterClosed();
  }

  public close() {
    this.dialogRef.close();
  }
}

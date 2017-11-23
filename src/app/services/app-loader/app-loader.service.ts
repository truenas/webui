import { Injectable } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Observable } from 'rxjs/Rx';
import { AppLoaderComponent } from './app-loader.component';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AppLoaderService {
  dialogRef: MdDialogRef<AppLoaderComponent>;
  constructor(private dialog: MdDialog,
    public translate: TranslateService) { }

  public open(title: string = 'Please wait'): Observable<boolean> {
    this.dialogRef = this.dialog.open(AppLoaderComponent, {disableClose: true});
    this.dialogRef.updateSize('200px');
    this.dialogRef.componentInstance.title = this.translate.instant(title);
    return this.dialogRef.afterClosed();
  }

  public close() {
    this.dialogRef.close();
  }
}

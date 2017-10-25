import {Injectable} from '@angular/core';
import {MdDialog, MdDialogRef} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import {AppLoaderComponent} from './app-loader.component';
import {Subject} from "rxjs/Subject";

@Injectable()
export class AppLoaderService {

  dialogRef: MdDialogRef<AppLoaderComponent>;

  private _progress = 0;

  private _intervalCounterId: any = 0;
  public interval = 175; // in milliseconds

  private eventSource: Subject<any> = new Subject<any>();
  public events: Observable<any> = this.eventSource.asObservable();
  public isOpen: Subject<any> = new Subject<any>();

  constructor(private dialog: MdDialog) {
  }

  set progress(value: number) {
    if (value !== undefined && value !== null) {
      this._progress = value;
      this.emitEvent(this._progress);
    }
  }

  get progress(): number {
    return this._progress;
  }

  private emitEvent(event: any) {
    if (this.eventSource) {
      // Push up a new event
      this.eventSource.next(event);
    }
  }

  start() {
    // Run the timer with milliseconds iterval
    this._intervalCounterId = setInterval(() => {
      // Increment the progress and update view component
      this.progress++;
      // If the progress is 100% - call complete
      if (this.progress === 100) {
        this.complete();
      }
    }, this.interval);
  }

  stop() {
    if (this._intervalCounterId) {
      clearInterval(this._intervalCounterId);
      this._intervalCounterId = null;
    }
  }

  complete() {
    this.progress = 100;
    this.stop();
    setTimeout(() => {
      setTimeout(() => {
        // Drop to 0
        this.progress = 0;
      }, 250);
    }, 250);
  }

  public open(title: string = 'Please wait'): void {
    this.start();
    // this.dialogRef = this.dialog.open(AppLoaderComponent, {disableClose: true});
    // this.dialogRef.updateSize('200px');
    // this.dialogRef.componentInstance.title = title;
    // return this.dialogRef.afterClosed();
    this.isOpen.next({open: true});
  }

  public close() {
    this.isOpen.next({open: false});
    this.complete();
  }
}

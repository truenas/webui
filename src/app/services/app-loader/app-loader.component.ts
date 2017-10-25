import {Component, OnInit} from '@angular/core';
import {MdDialog, MdDialogRef} from '@angular/material';
import {AppLoaderService} from "./app-loader.service";

@Component({
  selector: 'app-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.css']
})
export class AppLoaderComponent implements OnInit {

  title;
  message;
  progress;
  isLoaderOpen: any;

  constructor(public dialogRef: MdDialogRef<AppLoaderComponent>,
              private dialog: MdDialog,
              public service: AppLoaderService) {
  }

  ngOnInit() {
    console.group('IN LOADER');
    this.service.isOpen.subscribe(res => {
      console.log(res);
      this.isLoaderOpen = res.open;
    });

    if(this.isLoaderOpen) {
      console.log('if ma gyu');
      this.dialogRef = this.dialog.open(AppLoaderComponent, {disableClose: true});
      this.dialogRef.updateSize('200px');
      // this.dialogRef.componentInstance.title = title;
    }


    this.service.events.subscribe((event: any) => {
      this.progress = event;
    });
  }
}

import {Component, OnInit} from '@angular/core';
import {MdDialogRef} from '@angular/material';
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

  constructor(public dialogRef: MdDialogRef<AppLoaderComponent>,
              public service: AppLoaderService) {
  }

  ngOnInit() {
    this.service.events.subscribe((event: any) => {
      this.progress = event;
    });
  }
}

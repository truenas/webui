import { Component } from "@angular/core";
import { MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import helptext from "../../helptext/shell/shell";

@Component({
  selector: "app-copy-paste-message",
  template: `
      <h1 mat-dialog-title> {{title | translate}}</h1> 
      <div mat-dialog-content [innerHtml]="messageHtml"></div>
      <div mat-dialog-actions>
        <span fxFlex></span>
        <button class="mat-button mat-primary" (click)="dialogRef.close(true)"
        ix-auto="CLOSE"
        >{{"Close" | translate}}</button>
      </div>
  `
})
export class CopyPasteMessageComponent {
  public title = helptext.dialog_title; 
  public messageHtml = helptext.copy_paste_message;

  constructor(public dialogRef: MatDialogRef<CopyPasteMessageComponent>,
    protected translate: TranslateService) {}
}

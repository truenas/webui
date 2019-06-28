import { Component } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import helptext from "../../helptext/shell/shell";

@Component({
  selector: "app-copy-paste-message",
  template: `
    <section fxLayoutAlign="space-between center" fxLayoutGap="8px">
      <p [innerHtml]="messageHtml"></p>
      <button mat-button color="accent" fxFlex="88px" (click)="snackBar.dismiss()">{{ action }}</button>
    </section>
  `
})
export class CopyPasteMessageComponent {
  public messageHtml = helptext.copy_paste_message;
  public action = helptext.action_dismiss;

  constructor(public snackBar: MatSnackBar) {}
}

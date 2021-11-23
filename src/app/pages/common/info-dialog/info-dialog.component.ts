import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
})
export class InfoDialogComponent {
  title: string;
  info: string;
  icon: string;
  isHtml: boolean;

  constructor(
    public dialogRef: MatDialogRef<InfoDialogComponent>,
    protected translate: TranslateService,
  ) {}
}

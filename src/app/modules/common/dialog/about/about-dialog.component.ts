import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { productTypeLabels } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { SystemGeneralService } from 'app/services';

@Component({
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
})
export class AboutDialogComponent {
  systemType = this.systemGeneralService.getProductType();
  helptext = helptext;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    private systemGeneralService: SystemGeneralService,
  ) {}
}

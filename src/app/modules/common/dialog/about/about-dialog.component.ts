import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { LocaleService } from 'app/services/locale.service';

export interface DialogData {
  systemType: ProductType;
}

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.scss'],
  templateUrl: './about-dialog.component.html',
})
export class AboutDialogComponent {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  systemType: ProductType;
  helptext = helptext;
  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private localeService: LocaleService,
  ) {
    this.systemType = data.systemType;
  }
}

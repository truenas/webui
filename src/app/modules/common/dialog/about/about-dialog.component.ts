import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { SystemGeneralService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';

@Component({
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
})
export class AboutDialogComponent {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  systemType = this.systemGeneralService.getProductType();
  helptext = helptext;
  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    private localeService: LocaleService,
    private systemGeneralService: SystemGeneralService,
  ) {}
}

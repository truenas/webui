import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { LocaleService } from 'app/services/locale.service';

export interface DialogData {
  extraMsg: boolean;
  systemType: ProductType;
}

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.scss'],
  templateUrl: './about-dialog.component.html',
})
export class AboutDialogComponent {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  product_type: ProductType;
  extraMsg: boolean;
  systemType: ProductType;
  helptext = helptext;

  readonly ProductType = ProductType;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private core: CoreService,
    private localeService: LocaleService,
  ) {
    this.extraMsg = data.extraMsg;
    this.systemType = data.systemType;
  }

  turnOffWelcomeDialog(): void {
    localStorage.setItem('turnOffWelcomeDialog', 'true');
    this.core.emit({ name: 'ChangePreference', data: { key: 'showWelcomeDialog', value: false }, sender: this });
  }
}

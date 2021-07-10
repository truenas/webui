import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { AppLoaderService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
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
export class AboutModalDialog {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  product_type: ProductType;
  extraMsg: boolean;
  systemType: ProductType;
  helptext = helptext;

  readonly ProductType = ProductType;

  constructor(
    public dialogRef: MatDialogRef<AboutModalDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    protected loader: AppLoaderService,
    protected http: HttpClient, protected dialogService: DialogService,
    protected translate: TranslateService,
    protected core: CoreService,
    private prefServices: PreferencesService,
    private localeService: LocaleService,
  ) {
    this.extraMsg = data.extraMsg;
    this.systemType = data.systemType;
  }

  turnOffWelcomeDialog(): void {
    window.localStorage.setItem('setupComplete', 'true');
    this.core.emit({ name: 'ChangePreference', data: { key: 'showWelcomeDialog', value: false }, sender: this });
  }
}

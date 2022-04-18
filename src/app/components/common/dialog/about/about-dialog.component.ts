import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DialogService } from '../../../../services/dialog.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from '../../../../helptext/global-helptext';
import { T } from '../../../../translate-marker';
import { AppLoaderService } from '../../../../services';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/about';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { LocaleService } from 'app/services/locale.service';

export interface DialogData {
  systemType: string;
}

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.css'],
  templateUrl: './about-dialog.component.html',
})
export class AboutModalDialog {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  product_type: string;
  extraMsg: boolean;
  systemType: string;
  helptext = helptext;

  constructor(
    private localeService: LocaleService,
    public dialogRef: MatDialogRef<AboutModalDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    protected loader: AppLoaderService,
    protected http: HttpClient, protected dialogService: DialogService,
    protected translate: TranslateService,
    protected core: CoreService,
    private prefServices: PreferencesService,
  ) {
    this.systemType = data.systemType;
  }
}

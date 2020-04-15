import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DialogService } from '../../../../services/dialog.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from '../../../../helptext/global-helptext';
import { T } from '../../../../translate-marker';
import { AppLoaderService } from '../../../../services/';
import { PreferencesService } from 'app/core/services/preferences.service';

export interface DialogData {
  extraMsg: boolean;
}

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.css'],
  templateUrl: './about-dialog.component.html'
})
export class AboutModalDialog {
  public copyrightYear = globalHelptext.copyright_year;
  public product_type: string;
  public extraMsg;

  constructor(
    public dialogRef: MatDialogRef<AboutModalDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    protected loader: AppLoaderService,
    protected http: HttpClient, protected dialogService: DialogService, 
    protected translate: TranslateService,
    private prefServices: PreferencesService) { 
      this.extraMsg = data.extraMsg;
    }

    showLicenses() {
      this.loader.open();
      this.http.get('assets/disclaimer.txt', {responseType: 'text'}).subscribe(licenses => {
        this.loader.close();
        this.dialogService.confirm(T("View Licenses"), licenses, true, T("Ok"), 
          false, null, '', null, null, true).subscribe(ok => {
        });
      });
    }

    turnOffWelcomeDialog() {
      this.prefServices.preferences.showWelcomeDialog = false;
      this.prefServices.savePreferences();
    }
}

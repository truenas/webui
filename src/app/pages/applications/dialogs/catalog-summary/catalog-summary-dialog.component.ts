import { OnInit, Component, ViewEncapsulation, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplicationsService } from '../../applications.service';
import  helptext  from '../../../../helptext/apps/apps';
import { LocaleService } from 'app/services/locale.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@Component({
  selector: 'catalog-summary-dialog',
  styleUrls: ['./catalog-summary-dialog.component.scss'],
  templateUrl: './catalog-summary-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class CatalogSummaryDialog implements OnInit {
  public catalogApp: any;
  public statusOptions: string[] = ['All', 'Healthy', 'Unhealthy'];
  helptext = helptext;

  constructor(
    public dialogRef: MatDialogRef<CatalogSummaryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    protected localeService: LocaleService,
    private loader:AppLoaderService,
    private appService: ApplicationsService) { 
    this.catalogApp = data;
  }

  ngOnInit() {

  }

  onStatusOptionChanged($event) {

  }
}

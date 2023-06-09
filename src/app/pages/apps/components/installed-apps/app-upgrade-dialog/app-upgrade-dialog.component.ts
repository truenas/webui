import {
  Component, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { ChartUpgradeDialogConfig } from 'app/pages/apps-old/interfaces/chart-upgrade-dialog-config.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppLoaderService, DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  styleUrls: ['./app-upgrade-dialog.component.scss'],
  templateUrl: './app-upgrade-dialog.component.html',
})
export class AppUpgradeDialogComponent {
  imagePlaceholder = appImagePlaceholder;
  helptext = helptext;

  constructor(
    public dialogRef: MatDialogRef<AppUpgradeDialogComponent>,
    private errorHandler: ErrorHandlerService,
    private appService: ApplicationsService,
    private appLoader: AppLoaderService,
    public dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: ChartUpgradeDialogConfig,
  ) {}
}

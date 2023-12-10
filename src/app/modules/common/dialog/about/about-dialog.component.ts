import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutDialogComponent {
  systemType = this.systemGeneralService.getProductType();
  readonly helptext = helptextAbout;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    private systemGeneralService: SystemGeneralService,
  ) {}
}

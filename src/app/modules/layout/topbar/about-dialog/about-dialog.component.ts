import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { LetDirective } from 'app/directives/app-let.directive';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconModule,
    MatDialogContent,
    MatDialogActions,
    CopyrightLineComponent,
    MatButton,
    TestIdModule,
    TranslateModule,
    MapValuePipe,
    LetDirective,
  ],
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

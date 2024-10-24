import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LetDirective } from 'app/directives/app-let.directive';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectSystemInfoState } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatDialogContent,
    MatDialogActions,
    CopyrightLineComponent,
    MatButton,
    TranslateModule,
    MapValuePipe,
    LetDirective,
    TestDirective,
    AsyncPipe,
  ],
})
export class AboutDialogComponent {
  systemType = this.systemGeneralService.getProductType();
  readonly systemVersion$ = this.store$.select(selectSystemInfoState).pipe(map((system) => system.systemInfo?.version));
  readonly helptext = helptextAbout;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    private systemGeneralService: SystemGeneralService,
    private store$: Store<AppState>,
  ) {}
}

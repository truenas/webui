import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-train-info-card',
  styleUrls: ['train-info-card.component.scss'],
  templateUrl: './train-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    IxIconComponent,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class TrainInfoCardComponent {
  showInfoForEnterprise$ = combineLatest([
    this.updateService.updatesAvailable$,
    this.trainService.releaseTrain$,
    this.trainService.preReleaseTrain$,
    this.sysGenService.isEnterprise$,
  ]).pipe(
    map(([updatesAvailable, releaseTrain, preReleaseTrain, isEnterprise]) => {
      return updatesAvailable && isEnterprise && (releaseTrain || preReleaseTrain);
    }),
  );

  showInfoForTesting$ = combineLatest([
    this.updateService.updatesAvailable$,
    this.trainService.nightlyTrain$,
    this.trainService.preReleaseTrain$,
    this.sysGenService.isEnterprise$,
  ]).pipe(
    map(([updatesAvailable, nightlyTrain, preReleaseTrain, isEnterprise]) => {
      return updatesAvailable && (nightlyTrain || (preReleaseTrain && !isEnterprise));
    }),
  );

  constructor(
    private sysGenService: SystemGeneralService,
    private trainService: TrainService,
    private updateService: UpdateService,
  ) {}
}

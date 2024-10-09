import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { systemUpdateElements } from 'app/pages/system/update/update.elements';
import { TrainCardComponent } from './components/train-card/train-card.component';
import { TrainInfoCardComponent } from './components/train-info-card/train-info-card.component';
import { UpdateActionsCardComponent } from './components/update-actions-card/update-actions-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-update',
  styleUrls: ['update.component.scss'],
  templateUrl: './update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TrainCardComponent,
    MatCard,
    UiSearchDirective,
    MatCardContent,
    TestDirective,
    MatCardTitle,
    TrainInfoCardComponent,
    UpdateActionsCardComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class UpdateComponent {
  readonly SystemUpdateStatus = SystemUpdateStatus;
  protected readonly searchableElements = systemUpdateElements;

  constructor(
    protected trainService: TrainService,
    protected updateService: UpdateService,
  ) {}
}

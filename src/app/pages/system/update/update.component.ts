import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { systemUpdateElements } from 'app/pages/system/update/update.elements';

@UntilDestroy()
@Component({
  selector: 'ix-update',
  styleUrls: ['update.component.scss'],
  templateUrl: './update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateComponent {
  readonly SystemUpdateStatus = SystemUpdateStatus;
  protected readonly searchableElements = systemUpdateElements;

  constructor(
    protected trainService: TrainService,
    protected updateService: UpdateService,
  ) {}
}

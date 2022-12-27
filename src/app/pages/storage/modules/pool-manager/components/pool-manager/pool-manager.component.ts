import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './pool-manager.component.html',
  styleUrls: ['./pool-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerComponent { }

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { SystemGeneralService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  isLoading$ = this.store.isLoading$;

  hasEnclosureStep$ = combineLatest([
    this.store.hasMultipleEnclosures$,
    this.systemService.isEnterprise$,
  ]);

  constructor(
    private store: PoolManagerStore,
    private systemService: SystemGeneralService,
  ) {}

  ngOnInit(): void {
    this.store.initialize();
  }

  createPool(): void {

  }
}

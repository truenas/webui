import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { Device } from 'app/interfaces/device.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { isolatedGpusCardElements } from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-card/isolated-gpus-card.elements';
import {
  IsolatedGpusFormComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { GpuService } from 'app/services/gpu/gpu.service';

@UntilDestroy()
@Component({
  selector: 'ix-isolated-gpus-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './isolated-gpus-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    EmptyComponent,
    MatList,
    MatListItem,
    TranslateModule,
  ],
})
export class IsolatedGpusCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  isolatedGpus: Device[] = [];
  protected readonly searchableElements = isolatedGpusCardElements;

  readonly emptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No Isolated GPU Device(s) configured'),
    large: false,
    message: this.translate.instant('To configure Isolated GPU Device(s), click the "Configure" button.'),
  };

  constructor(
    private firstTimeWarning: FirstTimeWarningService,
    private gpuService: GpuService,
    private cdr: ChangeDetectorRef,
    private slideIn: SlideIn,
    private translate: TranslateService,
  ) {}

  get isolatedGpuNames(): string {
    return this.isolatedGpus.map((gpu) => gpu.description).join(', ');
  }

  ngOnInit(): void {
    this.loadIsolatedGpus();
  }

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.slideIn.open(IsolatedGpusFormComponent)),
      filter((response) => !!response.response),
      tap(() => this.loadIsolatedGpus()),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadIsolatedGpus(): void {
    this.gpuService.getIsolatedGpus().pipe(untilDestroyed(this)).subscribe((gpus) => {
      this.isolatedGpus = gpus;
      this.cdr.markForCheck();
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, input, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnDialog, TnIconButtonComponent,
  TnTooltipDirective,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, finalize, forkJoin, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import {
  AssociatedTargetDialogData, IscsiExtent, IscsiTarget, IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { convertStringToId } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-target-form/associated-target-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-associated-extents-card',
  styleUrls: ['./associated-extents-card.component.scss'],
  templateUrl: './associated-extents-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnButtonComponent,
    TnIconButtonComponent,
    TranslateModule,
    RequiresRolesDirective,
    TnTooltipDirective,
    NgxSkeletonLoaderModule,
  ],
})
export class AssociatedExtentsCardComponent {
  private tnDialog = inject(TnDialog);
  private iscsiService = inject(IscsiService);
  private loader = inject(LoaderService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  readonly target = input.required<IscsiTarget>();

  // Pre-split with lodash kebabCase so digit-bearing target names resolve identically
  // through the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
  protected readonly targetTestIdSlug = computed(() => kebabCase(convertStringToId(this.target().name)));

  readonly isLoadingExtents = signal<boolean>(false);
  readonly targetExtents = signal<IscsiTargetExtent[]>([]);
  readonly extents = signal<IscsiExtent[]>([]);

  readonly unassociatedExtents = computed(() => {
    return this.extents().filter((extent) => {
      return !this.targetExtents().some((targetExtent) => targetExtent.extent === extent.id);
    });
  });

  readonly mappedTargetExtents = computed(() => {
    return this.targetExtents().map((targetExtent) => {
      return {
        ...this.extents().find((extent) => extent.id === targetExtent.extent),
        ...targetExtent,
      };
    }).filter((extent) => extent.target === this.target().id);
  });

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor() {
    effect(() => {
      if (this.target()) {
        this.getTargetExtents();
      }
    });
  }

  associateTarget(): void {
    this.tnDialog.open(AssociatedTargetFormComponent, {
      data: {
        target: this.target(),
        extents: this.unassociatedExtents(),
      } as AssociatedTargetDialogData,
    }).closed
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => this.getTargetExtents());
  }

  removeExtentAssociation(extent: IscsiTargetExtent & IscsiExtent): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove extent association'),
      message: this.translate.instant('Are you sure you want to remove the extent association with {extent}?', {
        extent: `${this.translate.instant('LUN ID')}: ${extent.lunid} | ${extent.name} | ${extent.path}`,
      }),
      hideCheckbox: true,
      buttonText: this.translate.instant('Remove'),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.iscsiService.deleteTargetExtent(extent.id).pipe(this.loader.withLoader())),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.getTargetExtents());
  }

  private getTargetExtents(): void {
    this.isLoadingExtents.set(true);

    forkJoin([
      this.iscsiService.getExtents(),
      this.iscsiService.getTargetExtents(),
    ]).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoadingExtents.set(false)),
    ).subscribe(([extents, targetExtents]) => {
      this.extents.set(extents);
      this.targetExtents.set(targetExtents);
    });
  }
}

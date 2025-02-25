import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, input,
  signal,
} from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-target-form/associated-target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-associated-extents-card',
  styleUrls: ['./associated-extents-card.component.scss'],
  templateUrl: './associated-extents-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatButtonModule,
    TestDirective,
    TranslateModule,
    MatIconButton,
    IxIconComponent,
    MatCardContent,
    RequiresRolesDirective,
    MatTooltip,
    NgxSkeletonLoaderModule,
  ],
})
export class AssociatedExtentsCardComponent {
  readonly target = input.required<IscsiTarget>();

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

  constructor(
    private matDialog: MatDialog,
    private iscsiService: IscsiService,
    private loader: AppLoaderService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {
    effect(() => {
      if (this.target()) {
        this.getTargetExtents();
      }
    });
  }

  associateTarget(): void {
    this.matDialog.open(AssociatedTargetFormComponent, {
      data: {
        target: this.target(),
        extents: this.unassociatedExtents(),
      } as AssociatedTargetDialogData,
    }).afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
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
    }).pipe(
      filter(Boolean),
      switchMap(() => this.iscsiService.deleteTargetExtent(extent.id).pipe(this.loader.withLoader())),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => this.getTargetExtents());
  }

  private getTargetExtents(): void {
    this.isLoadingExtents.set(true);

    forkJoin([
      this.iscsiService.getExtents(),
      this.iscsiService.getTargetExtents(),
    ]).pipe(
      take(1),
      untilDestroyed(this),
      finalize(() => this.isLoadingExtents.set(false)),
    ).subscribe(([extents, targetExtents]) => {
      this.extents.set(extents);
      this.targetExtents.set(targetExtents);
      this.cdr.markForCheck();
    });
  }
}

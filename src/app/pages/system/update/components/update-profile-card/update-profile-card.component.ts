import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, input, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  async, filter, of, switchMap,
} from 'rxjs';
import { UpdateProfileChoices } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-update-profile-card',
  styleUrls: ['update-profile-card.component.scss'],
  templateUrl: './update-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TestDirective,
    MatButtonModule,
    TranslateModule,
    AsyncPipe,
  ],
})

export class UpdateProfileCard implements OnInit {
  protected updateProfileControl = new FormControl('');

  readonly profileChoices = input<UpdateProfileChoices>({});

  protected currentProfileId = signal('');

  protected availableProfiles = computed(() => {
    const choices = this.profileChoices();
    return Object.entries(choices)
      .filter(([_, profile]) => profile.available)
      .map(([id, profile]) => ({
        ...profile,
        id,
      }));
  });

  /**
   * Attempt to get label.
   * It may be absent in some situations.
   */
  protected currentProfileLabel = computed(() => {
    const currentProfile = Object.entries(this.profileChoices())
      .find(([id]) => id === this.currentProfileId());

    return currentProfile?.[1]?.name || this.currentProfileId();
  });

  protected isProfileMissingFromOptions = computed(() => {
    if (!this.currentProfileId()) {
      return false;
    }

    return !this.availableProfiles().some((profile) => profile.id === this.currentProfileId());
  });

  protected notAvailableProfiles = computed(() => {
    const choices = this.profileChoices();
    return Object.entries(choices)
      .filter(([_, profile]) => !profile.available)
      .map(([id, profile]) => ({
        ...profile,
        id,
      }));
  });

  protected profileOptions = computed(() => {
    return of(
      this.availableProfiles()
        .map((profile) => ({
          label: profile.name,
          value: profile.id,
        })),
    );
  });

  constructor(
    private updateService: UpdateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: LoaderService,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnInit(): void {
    this.updateService.getUpdateConfig()
      .pipe(untilDestroyed(this))
      .subscribe((config) => {
        this.currentProfileId.set(config.profile);
        this.updateProfileControl.patchValue(config.profile);
      });
  }

  applyProfile(): void {
    const selectedProfile = this.availableProfiles().find((profile) => profile.id === this.updateProfileControl.value);

    this.dialogService.confirm({
      message: this.translate.instant('Are you sure you want to switch to <b>{profile}</b> update profile?', { profile: selectedProfile?.name }),
      hideCheckbox: true,
      buttonText: this.translate.instant('Continue'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.updateService.updateConfig({ profile: this.updateProfileControl.value }).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('Switched to {profile} update profile', { profile: selectedProfile?.name }));
      },
    });
  }

  protected readonly async = async;
}

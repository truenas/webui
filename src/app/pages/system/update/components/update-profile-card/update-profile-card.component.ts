import {
  ChangeDetectionStrategy, Component, OnInit, computed, input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, of, switchMap } from 'rxjs';
import { UpdateProfileChoices } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { AppState } from 'app/store';

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
  ],
})

export class UpdateProfileCard implements OnInit {
  protected updateProfileControl = new FormControl('');

  readonly profileChoices = input<UpdateProfileChoices>({});

  profiles = computed(() => {
    const choices = this.profileChoices();
    return Object.entries(choices).map(([id, profile]) => ({
      id,
      name: profile.name,
      note: profile.footnote,
      description: profile.description,
      available: profile.available,
    }));
  });

  profileOptions = computed(() => {
    return of(
      this.profiles().filter((profile) => profile.available).map((profile) => ({
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
    private store$: Store<AppState>,
  ) { }

  ngOnInit(): void {
    this.updateService.getConfig()
      .pipe(untilDestroyed(this))
      .subscribe((config) => {
        this.updateProfileControl.patchValue(config.profile);
      });
  }

  applyProfile(): void {
    const selectedProfile = this.profiles().find((profile) => profile.id === this.updateProfileControl.value);

    this.dialogService.confirm({
      title: this.translate.instant('Change Update Profile'),
      message: this.translate.instant('Changing update profile to <b>{profile}</b> may impact system stability. Reverting to a stable version might not be possible.', { profile: selectedProfile?.name }),
      hideCheckbox: true,
      buttonText: this.translate.instant('Continue'),
      cancelText: this.translate.instant('Cancel'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.updateService.updateConfig({ profile: this.updateProfileControl.value })),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.snackbar.success(this.translate.instant('Update profile saved')),
    });
  }
}

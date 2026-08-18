import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, computed, untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCardAction, TnCardComponent, TnCardHeaderDirective, TnCheckboxComponent, TnProgressBarComponent, TnSpinnerComponent,
  tnIconMarker,
} from '@truenas/ui-components';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { CanComponentDeactivate } from 'app/modules/unsaved-changes/unsaved-form.guard';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-group-members',
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DualListBoxComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnCheckboxComponent,
    TnProgressBarComponent,
    TnSpinnerComponent,
    ReadOnlyComponent,
    TranslateModule,
  ],
})
export class GroupMembersComponent implements OnInit, CanComponentDeactivate {
  private api = inject(ApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private unsavedChangesService = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly tnIconMarker = tnIconMarker;
  protected readonly selectedMembers = signal<User[]>([]);
  protected readonly users = signal<User[]>([]);

  /**
   * The members the group had when the page settled, in the same shape the picker holds them:
   * ids of loaded users only, so a member the user list doesn't cover can't read as a change.
   * Null until the group loads, and reset after a successful save so leaving isn't questioned.
   */
  private readonly savedMemberIds = signal<number[] | null>(null);

  protected readonly isLoading = signal(false);
  protected readonly group = signal<Group | null>(null);
  protected readonly hideBuiltinUsers = signal(false);

  /**
   * The first load has nothing to show yet, so it gets a spinner in place of the picker.
   * A later load is a save in flight: the picker stays up and only the progress bar moves.
   */
  protected readonly isInitialLoading = computed(() => this.isLoading() && !this.group());

  /**
   * Built-in accounts (root, daemon, bin, ...) make up most of the list on a stock system
   * and bury the real users, so they can be filtered out of the picker. Built-ins on the
   * members side are kept: filtering one out of the source would make it vanish from both
   * lists the moment it is moved off that side, since the picker rebuilds its available list
   * out of the source it was given.
   *
   * The members are read untracked, so ticking the checkbox snapshots who is in the group
   * right then. Tracking them would rebuild the source on every move and reset the picker's
   * lists under the user.
   */
  protected readonly availableUsers = computed(() => {
    const users = this.users();

    if (!this.hideBuiltinUsers()) {
      return users;
    }

    const keptIds = new Set([
      ...this.group()?.users ?? [],
      ...untracked(this.selectedMembers).map((user) => user.id),
    ]);

    return users.filter((user) => !user.builtin || keptIds.has(user.id));
  });

  /**
   * How many built-ins the checkbox takes off screen. While it is ticked that is read back out
   * of the source the picker was actually given — the live member list can't be used there,
   * because the source is a snapshot and the two drift apart as members move around, leaving the
   * label claiming more is hidden than is. While it is not ticked, nothing is hidden yet, so the
   * count predicts what the snapshot would drop.
   */
  protected readonly builtinUserCount = computed(() => {
    if (this.hideBuiltinUsers()) {
      const shown = new Set(this.availableUsers().map((user) => user.id));

      return this.users().filter((user) => user.builtin && !shown.has(user.id)).length;
    }

    const shownAnyway = new Set([
      ...this.group()?.users ?? [],
      ...this.selectedMembers().map((user) => user.id),
    ]);

    return this.users().filter((user) => user.builtin && !shownAnyway.has(user.id)).length;
  });

  /**
   * Membership is a set, not a list: moving a member out and back leaves the picker holding
   * the same people in a different order, and that is not a change worth asking about.
   */
  private readonly hasUnsavedChanges = computed(() => {
    const savedIds = this.savedMemberIds();

    if (!savedIds) {
      return false;
    }

    const currentIds = this.selectedMembers().map((user) => user.id);

    return currentIds.length !== savedIds.length
      || currentIds.some((id) => !savedIds.includes(id));
  });

  protected readonly hasAccountWrite = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  protected readonly primaryAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAccountWrite()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Save'),
      handler: () => this.onSubmit(),
      disabled: this.isLoading(),
      testId: 'save',
    };
  });

  protected readonly secondaryAction = computed<TnCardAction>(() => ({
    label: this.translate.instant('Cancel'),
    handler: () => this.onCancel(),
    testId: 'cancel',
  }));

  ngOnInit(): void {
    this.isLoading.set(true);
    this.activatedRoute.params.pipe(
      switchMap((params) => forkJoin([
        this.api.call('group.query', [[['id', '=', parseInt(params.pk as string)]]]),
        this.api.call('user.query', [[['local', '=', true]]]),
      ])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([groups, users]) => {
        const group = groups[0];

        if (!group) {
          this.isLoading.set(false);
          this.snackbar.error(this.translate.instant('Group not found.'));
          this.router.navigate(['/', 'credentials', 'groups']);
          return;
        }

        if (!group.local) {
          this.isLoading.set(false);
          this.snackbar.error(this.translate.instant('Cannot manage members for directory service groups.'));
          this.router.navigate(['/', 'credentials', 'groups']);
          return;
        }

        const members = users.filter((user) => group.users.includes(user.id));

        this.group.set(group);
        this.users.set(users);
        this.selectedMembers.set(members);
        this.savedMemberIds.set(members.map((user) => user.id));
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
        this.router.navigate(['/', 'credentials', 'groups']);
      },
    });
  }

  canDeactivate(): Observable<boolean> {
    return this.hasUnsavedChanges() ? this.unsavedChangesService.showConfirmDialog() : of(true);
  }

  protected onCancel(): void {
    this.router.navigate(['/', 'credentials', 'groups']);
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const userIds = this.selectedMembers().map((user) => user.id);
    this.api.call('group.update', [this.group().id, { users: userIds }]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.savedMemberIds.set(userIds);
        this.router.navigate(['/', 'credentials', 'groups']);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}

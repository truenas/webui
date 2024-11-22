import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable, Subscription, timer,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Option } from 'app/interfaces/option.interface';
import { IxFullPageFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-full-page-form/ix-full-page-form-section/ix-full-page-form-section.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-full-page-form',
  templateUrl: './ix-full-page-form.component.html',
  styleUrls: ['./ix-full-page-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    ReadOnlyComponent,
    IxInputComponent,
    AppMetadataCardComponent,
    MatButton,
    RequiresRolesDirective,
    AsyncPipe,
    TranslateModule,
    TestDirective,
    ReactiveFormsModule,
    IxIconComponent,
  ],
})
export class IxFullPageFormComponent implements OnInit, OnDestroy {
  formGroup = input.required<FormGroup>();
  requiredRoles = input<Role[]>();
  searchMap = input<Map<string, string>>();
  pageTitle = input.required<string>();
  isLoading = input.required<boolean>();
  subscription = new Subscription();
  sections = contentChildren(IxFullPageFormSectionComponent);
  searchControl = this.formBuilder.control('');
  searchOptions = signal<Option[]>([]);
  onSubmit = output();
  buttonText = input.required<string>();

  readonly iconMarker = iconMarker;

  get hasRequiredRoles$(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles());
  }

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.handleSearchControl();
    this.updateSearchOption('');
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSectionClick(id: string, label: string = null): void {
    const nextElement = document.getElementById(id)
      || document.getElementById(label);
    if (!nextElement) {
      return;
    }

    nextElement?.scrollIntoView({ block: 'center' });
    nextElement.classList.add('highlighted');

    timer(999)
      .pipe(untilDestroyed(this))
      .subscribe(() => nextElement.classList.remove('highlighted'));
  }

  updateSearchOption(searchQuery: string): void {
    const options: Option[] = [];
    const query = searchQuery.toLowerCase().trim();
    for (const [key, label] of this.searchMap().entries()) {
      if (
        key.toLowerCase().trim().includes(query)
        || label.toLowerCase().includes(query)
      ) {
        options.push({ label, value: key });
      }
    }
    this.searchOptions.set(options);
  }

  private handleSearchControl(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value: string) => {
      const option = this.searchOptions().find((opt) => opt.value === value)
        || this.searchOptions().find((opt) => opt.label.toLocaleLowerCase() === value.toLocaleLowerCase());

      if (option) {
        this.onSectionClick(option.value.toString(), option.label);
      }
    });
  }
}

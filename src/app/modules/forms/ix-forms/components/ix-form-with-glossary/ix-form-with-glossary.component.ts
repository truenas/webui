import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  OnInit,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { timer } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Option } from 'app/interfaces/option.interface';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppMetadataCardComponent } from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-form-with-glossary',
  templateUrl: './ix-form-with-glossary.component.html',
  styleUrls: ['./ix-form-with-glossary.component.scss'],
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
export class IxFormWithGlossaryComponent implements OnInit {
  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  viewContainerRef!: ViewContainerRef;

  protected sections = contentChildren(IxFormSectionComponent);
  protected searchControl = this.formBuilder.control('');
  protected searchOptions = signal<Option[]>([]);

  readonly iconMarker = iconMarker;

  constructor(
    private formBuilder: FormBuilder,
    private formService: IxFormService,
  ) {
    this.formService.controlNamesWithlabels$.pipe(
      map((controlsWithLabels) => controlsWithLabels.map(
        (nameWithLabel) => ({ label: nameWithLabel.label, value: nameWithLabel.name }),
      )),
      untilDestroyed(this),
    ).subscribe({
      next: (options) => this.searchOptions.set(options),
    });
  }

  ngOnInit(): void {
    this.handleSearchControl();
  }

  protected onSectionClick(id: string, label: string = null): void {
    const nextElement = this.formService.getElementByControlName(id)
      || this.formService.getElementByLabel(label);
    if (!nextElement) {
      return;
    }

    nextElement?.scrollIntoView({ block: 'center' });
    nextElement.classList.add('highlighted');

    timer(999)
      .pipe(untilDestroyed(this))
      .subscribe(() => nextElement.classList.remove('highlighted'));
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

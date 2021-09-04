import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { SiblingInfo } from 'app/pages/system/general-settings/localization-form3/interfaces/sibling-info.interface';
import { Localization3Service } from 'app/pages/system/general-settings/localization-form3/services/localization.service';

@UntilDestroy()
@Component({
  selector: 'app-localization3',
  templateUrl: './localization-form3.component.html',
  styleUrls: ['./localization-form3.component.scss'],
})
export class LocalizationForm3 implements OnInit {
  form: FormGroup;
  name = 'Rehan2';
  sibling = 'john';

  fieldsetTitle = 'Fieldset Title';

  loading = false;

  formTitle = 'Personal Info';

  nameTooltip = 'This is a tip!';
  namePlaceholder = 'E.g., Rehan';
  readonly nameFormControlName = 'name';

  siblingLabel = 'Sibling';
  siblingTooltip = 'This is another tip!';
  siblingOptions: Option[] = [
    { label: 'Rehan', value: 'rehan' },
    { label: 'John', value: 'john' },
    { label: 'Steve', value: 'steve' },
  ];
  readonly siblingFormControlName = 'sibling';

  familyMemberTooltip = 'Pick a family member';
  familyMemberPlaceholder = 'Family Member';
  readonly familyMemberFormControlName = 'familyMember';

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      sibling: ['', [Validators.required]],
    });
    this.loading = true;
    this.localizationService.getSiblingInfo('Mike').pipe(untilDestroyed(this)).subscribe((res: SiblingInfo) => {
      this.loading = false;
      this.form.get(this.nameFormControlName).setValue(res.name);
      this.form.get(this.siblingFormControlName).setValue(res.favorite);
      this.siblingOptions = [];
      this.siblingOptions = Object.keys(res.siblings).map((key) => {
        return {
          label: key,
          value: res.siblings[key],
        };
      });
    });
  }

  filteredFamilyMembers = of([
    { label: 'Mike', value: 'mike' },
    { label: 'Jessica', value: 'Jessica' },
    { label: 'Asad', value: 'asad' },
  ]);
  familyMembers = [
    { label: 'Hassan', value: 'hassan' },
    { label: 'Yuan', value: 'yuan' },
  ];

  filterFamilyMembers(value: string): void {
    const filtered = [
      { label: 'Mike', value: 'mike' },
      { label: 'Jessica', value: 'Jessica' },
      { label: 'Asad', value: 'asad' },
    ].filter((option: Option) => option.value.toString().includes(value) || option.label.toString().includes(value));
    if (filtered.length) {
      this.filteredFamilyMembers = of(filtered);
    } else {
      this.filteredFamilyMembers = of([
        { label: 'Mike', value: 'mike' },
        { label: 'Jessica', value: 'Jessica' },
        { label: 'Asad', value: 'asad' },
      ]);
    }
  }

  loadMoreFamilyMembers(): Option[] {
    return [
      { label: 'Hassan', value: 'hassan' },
      { label: 'Yuan', value: 'yuan' },
    ];
  }

  cancelled(): void {
    // console.log('cancelled')
  }

  submit(value: any): void { // (value: any) {
    value;
    this.loading = true;
    this.localizationService.saveSiblingInfo(value).pipe(untilDestroyed(this)).subscribe((res: any) => {
      res;
      this.loading = false;
    });
  }

  constructor(private fb: FormBuilder, private localizationService: Localization3Service) {}
}

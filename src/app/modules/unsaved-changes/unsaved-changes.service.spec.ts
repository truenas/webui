import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnsavedChangesService } from './unsaved-changes.service';

describe('UnsavedChangesService', () => {
  let service: UnsavedChangesService;
  let dialogService: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UnsavedChangesService,
        {
          provide: DialogService,
          useValue: {
            confirm: jest.fn(() => of(true)),
          },
        },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
          },
        },
      ],
    });

    service = TestBed.inject(UnsavedChangesService);
    dialogService = TestBed.inject(DialogService);
  });

  it('should call dialogService.confirm when showConfirmDialog is called', () => {
    service.showConfirmDialog().subscribe();

    expect(dialogService.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to close?',
      cancelText: 'No',
      buttonText: 'Yes',
      buttonColor: 'warn',
      hideCheckbox: true,
    }));
  });
});

import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnsavedChangesService } from './unsaved-changes.service';

describe('UnsavedChangesService', () => {
  let service: UnsavedChangesService;
  let dialogService: DialogService;
  let authService: AuthService;

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
          provide: AuthService,
          useFactory: () => ({
            get hasAuthToken() {
              return true;
            },
          }),
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
    authService = TestBed.inject(AuthService);
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

  it('should return true without showing dialog when user is logged out', () => {
    jest.spyOn(authService, 'hasAuthToken', 'get').mockReturnValue(false);

    service.showConfirmDialog().subscribe((result) => {
      expect(result).toBe(true);
      expect(dialogService.confirm).not.toHaveBeenCalled();
    });
  });
});

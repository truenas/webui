import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { LoaderService } from 'app/modules/loader/loader.service';

describe('LoaderService', () => {
  let service: LoaderService;
  let matDialog: MatDialog;
  let mockDialogRef: Partial<MatDialogRef<AppLoaderComponent>>;
  let mockComponentInstance: Partial<AppLoaderComponent>;

  beforeEach(() => {
    mockComponentInstance = {
      setTitle: jest.fn(),
    };

    mockDialogRef = {
      id: 'test-dialog-id',
      componentInstance: mockComponentInstance as AppLoaderComponent,
      afterClosed: jest.fn(() => of(true)),
      close: jest.fn(),
    };

    const mockMatDialog = {
      open: jest.fn(() => mockDialogRef),
      openDialogs: [] as MatDialogRef<unknown>[],
    };

    TestBed.configureTestingModule({
      providers: [
        LoaderService,
        { provide: MatDialog, useValue: mockMatDialog },
      ],
    });

    service = TestBed.inject(LoaderService);
    matDialog = TestBed.inject(MatDialog);
  });

  afterEach(() => {
    service.close();
  });

  describe('open', () => {
    it('opens a dialog with default title', () => {
      service.open();

      expect(matDialog.open).toHaveBeenCalledWith(AppLoaderComponent, {
        disableClose: false,
        width: '200px',
        height: '200px',
      });
      expect(mockComponentInstance.setTitle).toHaveBeenCalledWith('Please wait');
    });

    it('opens a dialog with custom title', () => {
      service.open('Custom loading message');

      expect(mockComponentInstance.setTitle).toHaveBeenCalledWith('Custom loading message');
    });

    it('does not call setTitle if componentInstance is null', () => {
      mockDialogRef.componentInstance = null;

      service.open('Test title');

      expect(matDialog.open).toHaveBeenCalled();
      expect(mockComponentInstance.setTitle).not.toHaveBeenCalled();
    });
  });

  describe('setTitle', () => {
    it('sets title when dialog is open and componentInstance exists', () => {
      service.open();

      service.setTitle('New title');

      expect(mockComponentInstance.setTitle).toHaveBeenCalledWith('New title');
    });

    it('does not crash when dialogRef is null', () => {
      expect(() => {
        service.setTitle('Test title');
      }).not.toThrow();
    });

    it('does not crash when componentInstance is null', () => {
      service.open();
      mockDialogRef.componentInstance = null;

      expect(() => {
        service.setTitle('Test title');
      }).not.toThrow();
    });

    it('does not call setTitle when componentInstance is null', () => {
      service.open();
      mockDialogRef.componentInstance = null;
      jest.clearAllMocks();

      service.setTitle('Test title');

      expect(mockComponentInstance.setTitle).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('closes the dialog and sets dialogRef to null', () => {
      service.open();

      service.close();

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(service.dialogRef).toBeNull();
    });

    it('does not crash when dialogRef is already null', () => {
      expect(() => {
        service.close();
      }).not.toThrow();
    });
  });
});

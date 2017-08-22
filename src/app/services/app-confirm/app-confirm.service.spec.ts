import { TestBed, inject } from '@angular/core/testing';

import { AppConfirmService } from './app-confirm.service';

describe('AppConfirmService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppConfirmService]
    });
  });

  it('should be created', inject([AppConfirmService], (service: AppConfirmService) => {
    expect(service).toBeTruthy();
  }));
});

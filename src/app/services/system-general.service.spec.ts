import { TestBed, inject } from '@angular/core/testing';

import { SystemGeneralService } from './system-general.service';

describe('SystemGeneralService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SystemGeneralService]
    });
  });

  it('should be created', inject([SystemGeneralService], (service: SystemGeneralService) => {
    expect(service).toBeTruthy();
  }));
});

import { TestBed, inject } from '@angular/core/testing';

import { VmService } from './vm.service';

describe('VmService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VmService]
    });
  });

  it('should be created', inject([VmService], (service: VmService) => {
    expect(service).toBeTruthy();
  }));
});

import { TestBed, inject } from '@angular/core/testing';

import { IscsiService } from './iscsi.service';

describe('IscsiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IscsiService]
    });
  });

  it('should be created', inject([IscsiService], (service: IscsiService) => {
    expect(service).toBeTruthy();
  }));
});

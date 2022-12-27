import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateSummaryComponent } from './certificate-summary.component';

describe('CertificateSummaryComponent', () => {
  let component: CertificateSummaryComponent;
  let fixture: ComponentFixture<CertificateSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

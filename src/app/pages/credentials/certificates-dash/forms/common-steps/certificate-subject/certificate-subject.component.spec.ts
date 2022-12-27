import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateSubjectComponent } from './certificate-subject.component';

describe('CertificateSubjectComponent', () => {
  let component: CertificateSubjectComponent;
  let fixture: ComponentFixture<CertificateSubjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertificateSubjectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateSubjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

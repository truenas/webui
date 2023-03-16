import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CsrIdentifierAndTypeComponent } from './csr-identifier-and-type.component';

describe('CsrIdentifierAndTypeComponent', () => {
  let component: CsrIdentifierAndTypeComponent;
  let fixture: ComponentFixture<CsrIdentifierAndTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CsrIdentifierAndTypeComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(CsrIdentifierAndTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

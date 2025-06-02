import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NamespaceFormComponent } from 'app/pages/sharing/nvme-of/namespaces/namespace-form/namespace-form.component';

describe('NamespaceDialogComponent', () => {
  let component: NamespaceFormComponent;
  let fixture: ComponentFixture<NamespaceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NamespaceFormComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(NamespaceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

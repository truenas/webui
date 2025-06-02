import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseNamespaceFormComponent } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';

describe('NamespaceDialogComponent', () => {
  let component: BaseNamespaceFormComponent;
  let fixture: ComponentFixture<BaseNamespaceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseNamespaceFormComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(BaseNamespaceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

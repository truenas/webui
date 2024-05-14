import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { CloudCredentialsSelectComponent } from './cloud-credentials-select.component';

class MockTranslateService {
  translate(key: string): Observable<string> {
    return of(key);
  }
}

const cloudCredentialServiceMock = {
  getCloudSyncCredentials: jest.fn(() => of([
    { id: '1', name: 'AWS S3', provider: CloudSyncProviderName.AmazonS3 },
    { id: '2', name: 'Dropbox', provider: CloudSyncProviderName.Dropbox },
  ])),
};

describe('CloudCredentialsSelectComponent', () => {
  let component: CloudCredentialsSelectComponent;
  let fixture: ComponentFixture<CloudCredentialsSelectComponent>;
  let cloudCredentialService: jest.Mocked<CloudCredentialService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CloudCredentialsSelectComponent],
      providers: [
        {
          provide: CloudCredentialService,
          useValue: cloudCredentialServiceMock,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CloudCredentialsSelectComponent);
    component = fixture.componentInstance;
    cloudCredentialService = TestBed.inject(CloudCredentialService) as jest.Mocked<CloudCredentialService>;
  });

  it('should fetch options correctly', async () => {
    const options = await fixture.componentInstance.fetchOptions().toPromise();
    expect(options).toEqual([
      { label: 'AWS S3 (Amazon S3)', value: '1' },
      { label: 'Dropbox (Dropbox)', value: '2' },
    ]);
    expect(cloudCredentialService.getCloudSyncCredentials).toHaveBeenCalled();
  });

  it('should fetch and filter options correctly', async () => {
    component.filterByProviders = [CloudSyncProviderName.AmazonS3];

    const options = await fixture.componentInstance.fetchOptions().toPromise();
    expect(options).toEqual([{ label: 'AWS S3 (Amazon S3)', value: '1' }]);
    expect(cloudCredentialService.getCloudSyncCredentials).toHaveBeenCalled();
  });

  it('should return the correct form component type', () => {
    expect(component.getFormComponentType()).toBe(CloudCredentialsFormComponent);
  });
});

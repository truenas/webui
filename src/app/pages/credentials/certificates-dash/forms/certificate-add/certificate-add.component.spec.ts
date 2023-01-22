import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  CertificateAddComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ViewChild } from '@angular/core';
import {
  CertificateIdentifierAndTypeComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-identifier-and-type/certificate-identifier-and-type.component';
import {
  CertificateOptionsComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-options/certificate-options.component';
import {
  CertificateSubjectComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-subject/certificate-subject.component';
import {
  CertificateConstraintsComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/certificate-constraints.component';
import {
  CertificateCsrExistsComponent
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/steps/certificate-csr-exists/certificate-csr-exists.component';
import {
  CertificateImportComponent
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-import/certificate-import.component';
import { MockComponents, MockInstance } from 'ng-mocks';
import { TreeModel } from '@circlon/angular-tree-component';

describe('CertificateAddComponent', () => {

  const mockTreeMock = {
    selectedLeafNodeIds: {},
    setState(newState) {
      this.selectedLeafNodeIds = newState.selectedLeafNodeIds;
    },
    getState() {
      return {
        selectedLeafNodeIds: this.selectedLeafNodeIds,
      };
    },
  } as TreeModel;
  jest.spyOn(mockTreeMock, 'setState');
  jest.spyOn(mockTreeMock, 'getState');
  MockInstance(CertificateIdentifierAndTypeComponent, 'treeModel', mockTreeMock);

  let spectator: Spectator<CertificateAddComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: CertificateAddComponent,
    imports: [

    ],
    declarations: [
      MockComponents(
        CertificateIdentifierAndTypeComponent,
        CertificateOptionsComponent,
        CertificateSubjectComponent,
        CertificateConstraintsComponent,
        CertificateCsrExistsComponent,
        CertificateImportComponent,
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('certificate.create'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a new certificate when Type = Internal Certificate and form is submitted', () => {

  });

  it('imports a certificate when Type = Import Certificate and form is submitted', () => {

  });

  it('updates form fields and sets constrains when Profile is emitted by CertificateIdentifierAndTypeComponent', () => {

  });
});

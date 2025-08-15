import fs from "fs";

const productionFilePath = './src/environments/environment.prod.ts';
const productionFileContent = `import { enableProdMode } from '@angular/core';
import { sentryPublicDsn } from 'environments/sentry-public-dns.const';
import { WebUiEnvironment, environmentVersion, remote } from './environment.interface';

export const environment: WebUiEnvironment = {
  environmentVersion,
  remote,
  buildYear: ${new Date().getFullYear()},
  production: true,
  sentryPublicDsn,
  debugPanel: {
    enabled: false,
    defaultMessageLimit: 100,
    mockJobDefaultDelay: 1000,
    persistMockConfigs: true,
  },
};

// Production
enableProdMode();
`;
const environmentTs = 'src/environments/environment.ts';


// ng 7 requires this file to be there even though it replaces it upon runtime
if(!fs.existsSync(environmentTs)) {
  fs.closeSync(fs.openSync(environmentTs, 'w'));
}

function productionFileErrorHandler(err) {
  if(!err) {
    return;
  }
  console.error(
    'Failed to update production file. WebUI might not work as expected. See following error details.\n',
    err
  );
  exit();
}

fs.writeFile(
  productionFilePath,
  productionFileContent,
  null,
  productionFileErrorHandler
);

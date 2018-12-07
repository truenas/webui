#!/usr/bin/env node
const fs = require('fs');

// ng 7 requires this file to be there even though it replaces it upon runtime
var environment_ts = 'src/environments/environment.ts';

fs.closeSync(fs.openSync(environment_ts, 'w'));
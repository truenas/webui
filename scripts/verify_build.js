/**
 * This makes sure that there is no weird nodejs code present in dist build.
 * See https://ixsystems.atlassian.net/browse/NAS-110478 for more details.
 */
const exec = require('child_process').exec;

exec('grep -i process.platform -r dist || true', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  if (stdout) {
    console.error('ERROR: Nodejs code (process.platform) has been found in the build. See NAS-110478.')
    process.exit(2);
  }
});

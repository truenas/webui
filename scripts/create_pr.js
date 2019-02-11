#!/usr/bin/env node

var exec = require('child_process').exec;

var rightNow = new Date();
var date = rightNow.toISOString().slice(0,10).replace(/-/g,"");

async function git(cmd) {
    return new Promise(function (resolve, reject) {
        exec('git ' + cmd, function (err, stdout, stderr) {
            if (err) {
                reject(err);
              } else {
                resolve({ stdout, stderr });
              }
        });
    });
}

async function main() {
    var curr_branch = await git("rev-parse --abbrev-ref HEAD");
    if (curr_branch.stdout) {
        curr_branch = curr_branch.stdout.trim();
    }
    var po_branch = "PO-GENERATION-" + date
    await git("checkout -b " + po_branch);

}
  
main();


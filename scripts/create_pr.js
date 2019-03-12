#!/usr/bin/env node

const exec = require('child_process').exec;

var rightNow = new Date();
var date = rightNow.toISOString().slice(0,10).replace(/-/g,"");

async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        exec(cmd, function (err, stdout, stderr) {
            if (err) {
                reject(err);
              } else {
                resolve({ stdout, stderr });
              }
        });
    });
}

async function main() {

    var curr_branch = await sh("git rev-parse --abbrev-ref HEAD");
    if (curr_branch.stdout) {
        curr_branch = curr_branch.stdout.trim();
    }
    var po_branch = "PO-GENERATION-" + date + "-" + curr_branch
    await sh("git checkout -b " + po_branch);
    let title = "PO File automated PR " + date + " " + curr_branch;
    await sh("git add .")
    await sh("git commit -m \'" + title + "\'");
    await sh("git push --set-upstream origin " + po_branch);
    await sh("hub pull-request -m '" + title + "' -b " + curr_branch + " -h " + po_branch);

}
  
main();


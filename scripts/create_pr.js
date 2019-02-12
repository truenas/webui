#!/usr/bin/env node

const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs-extra');
const octokit = require('@octokit/rest')();
const CONFIG_FILE = path.join(process.cwd(), './github-pr.json');

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

async function readConfig () {
    // to set this up run github-pr --init first
	let json = {}

	try {
		json = await fs.readJson(CONFIG_FILE)
	} catch (ex) {
		// file not found
	}

	return json
}

async function main() {
    let config = await readConfig();

    if (!config.token) {
        console.warn('Github access token is not initialized')

        return
    }

    var curr_branch = await git("rev-parse --abbrev-ref HEAD");
    if (curr_branch.stdout) {
        curr_branch = curr_branch.stdout.trim();
    }
    var po_branch = "PO-GENERATION-" + date + "-" + curr_branch
    await git("checkout -b " + po_branch);
    let title = "PO File automated PR " + date;
    await git("commit -a -m " + title);
    await git("push --set-upstream origin " + po_branch);

    octokit.authenticate({
        type: 'token',
        token: config.token
    });

    let result = await octokit.pullRequests.create({
        owner: config.owner,
        repo: config.repo,
        head: po_branch,
        base: curr_branch,
        title
    });

    console.log(result.meta.status)
    console.log(result.data.url)

}
  
main();


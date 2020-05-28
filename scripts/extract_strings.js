#!/usr/bin/env node

var fs = require( 'fs' );
var path = require( 'path' );
// In newer Node.js versions where process is already global this isn't necessary.
var process = require( "process" );
var exec = require('child_process').exec;

var translations = "src/assets/i18n/";

// Loop through all the files in the temp directory
fs.readdir( translations, function( err, files ) {
    if( err ) {
        console.error( "Could not list the directory.", err );
        process.exit( 1 );
    } 

    var pos = "";

    files.forEach( function( file, index ) {
        if (file.match(/\.po$/)) {
            pos += translations + file + " ";
        }
    });

    exec('ngx-translate-extract --input src --output ' + pos + ' --clean --sort --format pot -m T', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            console.error( "Error extracting strings." );
            // node couldn't execute the command
            process.exit(1);
        }
        console.log(stdout);
        console.error(stderr);
    });
});
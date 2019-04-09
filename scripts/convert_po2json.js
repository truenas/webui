#!/usr/bin/env node

var fs = require( 'fs' );
var path = require( 'path' );
// In newer Node.js versions where process is already global this isn't necessary.
var process = require( "process" );
var exec = require('child_process').exec;

var translations = "src/assets/i18n/";
var po2json = require('po2json');

// Loop through all the files in the temp directory
fs.readdir( translations, function( err, files ) {
    if( err ) {
        console.error( "Could not list the directory.", err );
        process.exit( 1 );
    } 

    files.forEach( function( file, index ) {
        if (file.match(/\.po$/)) {
            let jsonfile = file.replace(/\.po$/, '.json');

            console.log("Generating " + jsonfile);
            try {
                jsondata = po2json.parseFileSync(translations + file, {pretty:true, stringify: true, format: 'mf', fullMF: false, 'fallback-to-msgid': true});
                stream = fs.createWriteStream(translations + jsonfile, {});
                stream.write(jsondata);
                
            } catch(e) {
                console.error( "Error converting file.", e);
            }
        }
    });
});
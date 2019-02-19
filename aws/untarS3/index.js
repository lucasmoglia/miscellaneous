var AWS = require('aws-sdk');
var util = require('util');
var tar = require('tar-stream');
const https = require('https');
var s3 = new AWS.S3();

exports.handler = function(event, context, callback) {
    // Read options from the event.
    const startTime = new Date();
    let listenerRetryTime;
    
    console.log("Reading options from AWS S3 event:\n", util.inspect(event, {depth: 5}));
    let srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    let fileName = srcKey.split('.')[0];
    let type = srcKey.match(/\.([^.]*)$/)[1];
    var extract = tar.extract();
    var maxRetries = 3;

    if ((type != "tar" && type != "tgz" && type != "gz") || type.indexOf("untar") > 0) {
        // console.log("Error while trying to read format: " + type);
        return false;
    }
    
    console.log("Processing new file:\n", srcKey);

    function deleteObject(params, cb){
        s3.deleteObject(params, function(err, data) {
          if (err){
            console.log(err, err.stack);// error   
            cb(err);
          }
          else {
            console.log(); // deleted
            cb(null, "OK");
          }
        });
    }
    
    function appendToJSONFileAndRename(params, name, content, cb) {
        console.log("Trying to append and rename: \n" + JSON.stringify(params));
        s3.getObject(params, function(err, data){
            if(err) {
                console.log("Something went wrong while trying to get S3 original object: \n" + err);
                cb(err);
            }
            if(!name || name == "") {
                name = params.Key;
            }
            
            let json = JSON.parse(new Buffer(data.Body).toString("utf8"));
            console.log(json);
            json.push(content);
            deleteObject(params, function(err, res) {
                if(err) {
                    console.log("Error trying to delete file");
                    cb(err, null);
                } 
                s3.putObject({
                    Bucket: params.Bucket,
                    Key: name,
                    Body: JSON.stringify(json),
                    }, function (err) {
                        if (err) {
                            console.log('Error uploading file: ' + err);
                            cb(err, null);
                        }
                        cb(null, json);
                    }
                );
            });
        });
    }

    function callListener(retry, err) {
        var currentFilePath = fileName + (retry == maxRetries ? '/.ready' : '/.error');
        console.log(retry);
        if (retry < 0){
            console.log("I'm out of retries...please HELP!");
            return false;
        }
    
        https.get('https://test.com/', (resp) => {
            listenerRetryTime = new Date();
            
            resp.on("data", (chunk) => {
                 // console.log(chunk);
            });
            
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                if(resp.statusCode != 200) {
                    console.log("An error has occured while trying to call the listener. He said: \n " + resp.statusMessage);
                    appendToJSONFileAndRename({Bucket: params.Bucket, Key: currentFilePath}, fileName + "/.error", { event: "error", start: listenerRetryTime, end: new Date() }, function (err, data){
                        if(err) { console.log("ERROR trying to rename the file!") };
                        setTimeout(function () {
                            callListener(retry - 1, err);
                        }, 1000);
                        
                    });
                } else {
                    console.log("Communication with listener stablished successfuly");
                    appendToJSONFileAndRename({Bucket: params.Bucket, Key: currentFilePath}, fileName + "/.notified", { event: "notified", start: listenerRetryTime, end: new Date() }, function (err, data){
                        if(err) { console.log("ERROR trying to rename the file!") };
                        setTimeout(function () {
                            callListener(retry - 1, err);
                        }, 1000);
                    });
                }
            });
            
            }).on("error", (err) => {
                if (err) {
                    console.log("An error has occured while trying to call the listener, can somebody wake him up? \n " + err);
                    appendToJSONFileAndRename({Bucket: params.Bucket, Key: currentFilePath}, fileName + "/.error", { event: "error", start: listenerRetryTime, end: new Date() }, function (err, data){
                        if(err) { console.log("ERROR trying to rename the file!") };
                        setTimeout(function () {
                            callListener(retry - 1, err);
                        }, 1000);
                    });
                }
            });
    }

    const params = {
        Bucket: event.Records[0].s3.bucket.name,
        Key: srcKey
    };

    console.log("working with params: " + JSON.stringify(params));

    extract.on('entry', function(header, stream, callback) {
        // make directories or files depending on the header here...
        // call callback() when you're done with this entry
        s3.putObject({
            Bucket: params.Bucket,
            Key: fileName + '/' + header.name,
            Body: stream,
            ContentLength: header.size
            }, function (err) {
                if (err) {
                    console.log('Error uploading file: ' + err);
                }
                callback();
            }
        );

    });

    extract.on('finish', function() {
        s3.putObject({
            Bucket: params.Bucket,
            Key: fileName + '/.ready',
            Body: JSON.stringify([{event: "ready", start: startTime, end: new Date()}])
            }, function (err) {
                if (err) {
                    console.log('Error uploading file: ' + err);
                } else {
                    callback();
                    console.log("Calling Listener...");
                    callListener(maxRetries, null);
                }
            }
        );
    });

    s3.getObject(params).createReadStream().pipe(extract);
};
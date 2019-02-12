var AWS = require('aws-sdk');
var util = require('util');
var tar = require('tar-stream');
var s3 = new AWS.S3();

exports.handler = function(event, context, callback) {
    let srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    let fileName = srcKey[0];
    let type = srcKey.match(/\.([^.]*)$/)[1];
    var extract = tar.extract();
    
    console.log("Processing new file -> ", srcKey);

    // Validating file type
    if ((type != "tar" && type != "tgz" && type != "gz") || type.indexOf("untar") > 0) {
        console.log("Error while trying to read format: " + type);
        return false;
    }
    
    // Read options from the event.
    console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));

    const params = {
        Bucket: event.Records[0].s3.bucket.name,
        Key: srcKey
    };

    console.log("working with params: " + params);

    extract.on('entry', function(header, stream, callback) {
        // make directories or files depending on the header here...
        // call callback() when you're done with this entry
        s3.putObject({
            Bucket: params.Bucket,
            Key: header.name,
            Body: stream,
            ContentLength: header.size
            }, function (err) {
                if (err) {
                    console.log('uploaded file: ' + err);
                } else {
                    callback();
                    console.log("Calling Listener...");
                    callListener(3, null);
                }
            }
        );

    });

    extract.on('finish', function() {
        console.log('TAR operation complete!')
    });

    console.log("Normal routine now...");
    s3.getObject(params).createReadStream().pipe(extract);
};
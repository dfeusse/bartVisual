window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function(fs) {
    fs.root.getFile('log.txt', {create: true}, function(fileEntry) {
        fileEntry.createWriter(function(writer) { 
            writer.onwrite = function(e) { console.log('heya') };
            writer.onerror = function(e) { console.log('kate') };
            var bb = new BlobBuilder();
            bb.append('Hello World!');

            writer.write(bb.getBlob('text/plain'));
        }, opt_errorHandler)
    })
}, opt_errorHandler)
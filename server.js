var express			= require('express');
var fs				= require('fs');
var client			= require('twilio')('ACbb985276cbba26a72ef6356608064ae2', 'dc60f64b4d39ca886e4502bbbb40e992');
var spawn			= require('child_process').spawn;
var phantom_path	= 'phantomjs';
var interval		= 3600000;
var app             = express();
process.env.TZ		= 'GMT-7';

var doScrap = function() {
	var ps = spawn(phantom_path, ['pantom.js']);
	
	ps.stdout.on('data', function(stream) {
		var result = JSON.parse(stream);
		//console.log(result);
		if (result.kirim_sms == 1) {
			client.sendMessage({
				to:'+6285649450667',
				from: '+18039372575',
				body: result.isi_sms
			}, function(err, responseData) {
				if (!err) {
					console.log("SMS Terkirim: " + responseData.body);
				}
			});
		} else {
			console.log("Tidak Ada Penerbangan yang Memenuhi Kriteria.");
		}
	});

	ps.stderr.on('data', function(stream) {
		console.log(stream.toString());
	});

	ps.on('exit', function (code) {
	  //console.log('child process exited with code ' + code);
	});
};

doScrap();
setInterval(function() {
	doScrap();
}, interval );

app.get('/', function(req, res) {
    fs.readFile('log.txt', function (err, data) {
        if (err) throw err;
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 7777;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.listen(server_port, server_ip_address, function() {
    console.log('Express server listening on port ' + server_port);
});

var page = require('webpage').create();
var fs = require('fs');

var from = "BKKA";
var to = "SUB";
var tgl = "17-02-2015";
var orang = "1";
var timeout = 60000;
var threshold = 1000000;
var url = "http://www.traveloka.com/fullsearch?ap="+from+"."+to+"&dt="+tgl+".NA&ps="+orang+".0.0";
var pesan_sms = from + ' ' + to + ' ' + tgl + ' ' + orang;
var data = {}

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : timeout, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    data['wait'] = "timeout";
					console.log(JSON.stringify(data));
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
					data['wait'] = "finished in " + (new Date().getTime() - start) + "ms.";
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 250); //< repeat check every 250ms
};

var scrap = function() {
	var harga = [];
	$('.travelokaPrice .tv-fs-result-hp-main').each(function() {
		harga.push($(this).html());
	});
	
	var i = 0;
	$('.travelokaPrice .tv-fs-result-hp-tail').each(function() {
		harga[i] = harga[i] + $(this).html();
		i++;
	});
	
	return harga;
};

page.open(url, function(status) {
	data['status'] = status;
	if (status !== 'success') {
		throw "Page load issue " + status;
		return;
	}
		
	page.onError = function (msg, trace) {
		console.error('error > ' + msg);
		console.error(trace);
	}
	page.onAlert = function(msg) {
		//console.error('alert > ' + msg);
	}
	page.onConsoleMessage = function (msg, line, source) {
	    var l = (line != undefined) ? ' @ line: ' + line : '';
    	//console.error('> ' + msg + l);
	}
	
	waitFor(function() {
		return page.evaluate(function() {
			return $('#loadingInfo').length == 0;
		});
	}, function() {
		var result = page.evaluate(scrap);
		data['harga'] = result;
		if (result.length == 0) {
			data['nihil'] = 1;
		} else {
			data['nihil'] = 0;
			var d = new Date();		
			fs.write('log.txt', d.toString() + '\n' + pesan_sms + '\n' + JSON.stringify(result) + '\n' + data['wait'] + '\n\n', 'a');
			
			pesan_sms += ' ' + result[0];
			var harga_min = result[0].replace(/\./g, '');
			if (harga_min > threshold) {
				// mahal gak usah kirim sms
				data['kirim_sms'] = 0;
			} else {
				// murah kirim sms notif
				data['kirim_sms'] = 1;
				data['isi_sms'] = pesan_sms;
			}
		}
		console.log(JSON.stringify(data));
  		phantom.exit();
	});
});

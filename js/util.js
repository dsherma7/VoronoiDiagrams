// Load a text resource from a file over the network
var loadTextResource = function (url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
	request.onload = function () {
		if (request.status < 200 || request.status > 299) {
			callback('Error: HTTP Status ' + request.status + ' on resource ' + url);
		} else {
			callback(null, request.responseText);
		}
	};
	request.send();
};

var loadImage = function (url, callback) {
	var image = new Image();
	image.onload = function () {
		callback(null, image);
	};
	image.src = url;
};

var loadJSONResource = function (url, callback) {
	loadTextResource(url, function (err, result) {
		if (err) {
			callback(err);
		} else {
			try {
				callback(null, JSON.parse(result));
			} catch (e) {
				callback(e);
			}
		}
	});
};

Array.prototype.layers = function() {
    if (this[0].layers)
        return 1 + this[0].layers();
    return 1;
}


Array.prototype.expand = function(out) {
    
    if (! out) {out = [];}
    if (this.layers() == 1) { out.push(this); }
    
    this.forEach(function(d){
        if(d.expand)
            d.expand(out);
    });
    return out;
}

Array.prototype.permute = function(k) {
    var i, j, combs, head, tailcombs;
    
    // There is no way to take e.g. sets of 5 elements from
    // a set of 4.
    if (k > this.length || k <= 0) {
        return [];
    }
    
    // K-sized set has only one K-sized subset.
    if (k == this.length) {
        return [this];
    }
    
    // There is N 1-sized subsets in a N-sized set.
    if (k == 1) {
        combs = [];
        for (i = 0; i < this.length; i++) {
            combs.push([this[i]]);
        }
        return combs;
    }
    
    combs = [];
    for (i = 0; i < this.length - k + 1; i++) {
        head = this.slice(i, i + 1);
        tailcombs = this.slice(i + 1).permute(k-1);
        // For each (k-1)-combination we join it with the current
        // and store it to the set of k-combinations.
        for (j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]));
        }
    }
    return combs;
}


Array.prototype.flatten = function() {
	var out = []; 
	this.map(d => d.map(c => out.push(c)));
	return out;
}


Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};


Array.prototype.shuffle = function() {
  var currentIndex = this.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = this[currentIndex];
    this[currentIndex] = this[randomIndex];
    this[randomIndex] = temporaryValue;
  }
}
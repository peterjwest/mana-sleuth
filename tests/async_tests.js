var async = require('../util/async.js');
var tester = require('../util/tester.js');

tester.tests = exports;

// Runs a simple promise which resolves synchronously
tester.start("test-promise-sync");
async.promise(function() {
    this.success("foo");
})
.then(function(value) {
  tester.complete("test-promise-sync", value, "foo");
});

// Runs a simple promise which resolves asynchronously
tester.start("test-promise-async");
async.promise(function() {
    var next = this;
    setTimeout(function() {
      next.success("bar");
    }, 50);
})
.then(function(value) {
  tester.complete("test-promise-async", value, "bar");
});

// Runs several promises on synchronous and asynchronous blocks
tester.start("test-multiple-mixed-promises");
async.promise(function() {
  this.success([1,2,3]);
})
.then(function(values) {
  values.push(4);
  this.success(values);
})
.then(function(values) {
  var next = this;
  setTimeout(function() {
    next.success(values.join("+"));
  }, 10);
})
.then(function(values) {
  tester.complete("test-multiple-mixed-promises", values, "1+2+3+4");
});

// Runs a synchronous promise for an array of items
tester.start("test-map-sync");
async.map([1,2,3,4,5,6], function(item, i) {
  this.success(item * 2);
})
.then(function(values) {
  tester.complete("test-map-sync", values.join(","), "2,4,6,8,10,12");
});

// Runs an asynchronus promise for an array of items
tester.start("test-map-async");
async.map([1,2,3,4,5,6], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item * 3);
  }, 10);
})
.then(function(values) {
  tester.complete("test-map-async", values.join(","), "3,6,9,12,15,18");
});

// Runs a synchronous promise for any array of items twice
tester.start("test-map-twice-sync");
async.map([1,2,3], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item);
  }, 50);
})
.map(function(item) { this.success(item + 1); })
.then(function(values) {
  tester.complete("test-map-twice-sync", values.join(","), "2,3,4");
});

// Runs an asynchronous promise for any array of items twice
tester.start("test-map-twice-async");
async.map([1,2,3], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item);
  }, 50);
})
.map(function(item) { this.success(item + 2); })
.then(function(values) {
  tester.complete("test-map-twice-async", values.join(","), "3,4,5");
});

// Runs a synchronous promise which takes a synchronous promise-returning-function as a callback
tester.start("test-sync-promise-integration-with-sync");
var promiseMaker = function(value) {
  return async.promise(function() {
    this.success(value * 2 - 2);
  });
};

async.promise(function() {
  this.success(7);
})
.then(promiseMaker)
.then(function(value) {
  tester.complete("test-sync-promise-integration-with-sync", value, 12);
});

// Runs an asynchronous promise which takes a synchronous promise-returning-function as a callback
tester.start("test-sync-promise-integration-with-async");
var promiseMaker = function(value) {
  return async.promise(function() {
    this.success(value * 2 - 2);
  });
};

async.promise(function() {
  var next = this;
  setTimeout(function() {
    next.success(5);
  }, 30);
})
.then(promiseMaker)
.then(function(value) {
  tester.complete("test-sync-promise-integration-with-async", value, 8);
});

// Runs a synchronous promise which takes an asynchronous promise-returning-function as a callback
tester.start("test-async-promise-integration-with-sync");
var promiseMaker = function(value) {
  return async.promise(function() {
    var next = this;
    setTimeout(function() {
      next.success(value * 3 - 4);
    }, 30);
  });
};

async.promise(function() {
  this.success(7);
})
.then(promiseMaker)
.then(function(value) {
  tester.complete("test-async-promise-integration-with-sync", value, 17);
});

// Runs an asynchronous promise which takes an asynchronous promise-returning-function as a callback
tester.start("test-async-promise-integration-with-async");
var promiseMaker = function(value) {
  return async.promise(function() {
    var next = this;
    setTimeout(function() {
      next.success(value * 3 - 4);
    }, 30);
  });
};

async.promise(function() {
  var next = this;
  setTimeout(function() {
    next.success(5, 3, 2);
  }, 30);
})
.then(promiseMaker)
.then(function(value, value) {
  tester.complete("test-async-promise-integration-with-async", value, 11);
});

tester.print();
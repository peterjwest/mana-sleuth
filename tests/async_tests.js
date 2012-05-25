var async = require('../util/async.js');
var tester = require('../util/tester.js')

// Runs a simple promise which resolves synchronously
tester.start("test-promise-sync");
async.promise(function() {
    this.success("test-sync");
})
.then(function(value) {
  tester.complete("test-promise-sync", "test-sync", value);
});

// Runs a simple promise which resolves asynchronously
tester.start("test-promise-async");
async.promise(function() {
    var next = this;
    setTimeout(function() {
      next.success("test-async");
    }, 50);
})
.then(function(value) {
  tester.complete("test-promise-async", "test-async", value);
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
  tester.complete("test-multiple-mixed-promises", "1+2+3+4", values);
});

// Runs a promise for an array of items
tester.start("test-map");
async.map([1,2,3,4,5,6], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item * 2);
  }, 10);
})
.then(function(values) {
  tester.complete("test-map", "2,4,6,8,10,12", values.join(","));
});

// Runs a promise for any array of items twice
tester.start("test-map-twice");
async.map([1,2,3], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item);
  }, 50);
})
.map(function(item) { this.success(item + 1); })
.then(function(values) {
  tester.complete("test-map-twice", "2,3,4", values.join(","));
});

// Runs a promise which takes a promise-returning-function as a callback
tester.start("test-promise-integration");
var promiseMaker = function(value) {
  return async.promise(function() {
    this.success(value * 2 - 2);
  });
};
async.promise(function() {
  var next = this;
  setTimeout(function() {
    next.success(7);
  }, 180);
})
.then(promiseMaker)
.then(function(value) {
  tester.complete("test-promise-integration", 12, value);
});

tester.print();
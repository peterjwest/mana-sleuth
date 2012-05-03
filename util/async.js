// Asynchronous Tools for Javascript
// By Peter West
// March 2012

// TODO
// Add fail event
// Prevent multiple firing?
// Make it work for falsey values

var async = exports || {};
var nothing = function() {};

// Runs a function in a promise interface
async.promise = function(fn) {
  var create = function() {

    // Creates an empty promise
    var promise = {};
    promise.next = {
      success: function() {
        promise.succeeded = true;
        promise.result = arguments[0];
        if (promise.success) promise.success();
      },
      fail: function() { promise.failed = arguments[0]; },
      async: function() { return promise.next; }
    };

    // Adds then method to the promise
    promise.then = function(success, fail) {
      var newPromise = create();
      promise.success = function() {
        success.call(newPromise.next, promise.result);
      };
      if (promise.succeeded) promise.success();
      return newPromise;
    };

    // Adds map method to the promise
    promise.map = function(success, fail) {
      var newPromise = create();
      promise.success = function() {
        async.map(promise.result, success).then(function(result) {
          newPromise.next.success(result);
        });
      };
      if (promise.succeeded) promise.success();
      return newPromise;
    };
    return promise;
  };

  // Creates a promise and runs it on the function provided
  var promise = create();
  fn.apply(promise.next);
  return promise;
};

// Runs a function with asynchronous behaviour on an array of items
async.map = function(items, fn) {
  return async.promise(function() {
    var next = this;
    var array = [];

    // Runs the function on one item by index
    var iterate = function(fn, i) {
      if (i < items.length) {
        fn.call({
          success: function(returned) { array.push(returned); iterate(fn, i + 1) },
          fail: function() { next.fail(array); }
        }, items[i], i);
      }
      else { next.success(array); }
    };

    // Runs the first item
    iterate(fn, 0);
  });
};
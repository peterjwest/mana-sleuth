// Asynchronous Tools for Javascript
// By Peter West
// March 2012

// TODO
// Suport error event better
// Prevent multiple firing?

var async = exports || {};

// Wraps a function in a timeout to prevent recursion based overflows
var unscope = function(fn) { return function() { setTimeout(fn, 0); }; };

// Runs a function in a promise interface
async.promise = function(fn) {
  var create = function() {

    // Creates an empty promise
    var promise = {};
    promise.next = {
      success: function() {
        promise.resolved = true;
        promise.result = arguments;
        if (promise.propagate) promise.propagate();
      },
      fail: function() { promise.failed = arguments; },
      async: function() { return promise.next; }
    };

    // Adds then method to the promise
    promise.then = function(success, fail) {
      var nextPromise = create();
      promise.propagate = unscope(function() {
        var response = success.apply(nextPromise.next, promise.result);
        if (response && response.then) {
          if (!nextPromise.propagate) {
            nextPromise.then = response.then;
          }
          if (response.resolved && nextPromise.propagate) {
            nextPromise.result = response.result;
            nextPromise.propagate();
          }
          if (!response.resolved && nextPromise.propagate) {
            response.then(function() {
              nextPromise.result = arguments;
              nextPromise.propagate();
            });
          }
        }
      });
      if (promise.resolved) promise.propagate();
      return nextPromise;
    };

    // Adds map method to the promise
    promise.map = function(success, fail) {
      var nextPromise = create();
      promise.propagate = function() {
        async.map(promise.result[0], success).then(function(result) {
          nextPromise.next.success(result);
        });
      };
      if (promise.resolved) promise.propagate();
      return nextPromise;
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
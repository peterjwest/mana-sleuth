// Asynchronous Tools for Javascript
// By Peter West
// March 2012

// TODO
// Add fail event
// Prevent multiple firing
// Add map behaviour to chain method

var async = exports || {};
var nothing = function() {};

// Runs a function in a promise interface
async.promise = function(fn) {
  var create = function() {
  
    // Creates an empty promise
    var promise = {sync: true};
    promise.next = {
      success: function() { 
        promise.succeeded = arguments;
        if (promise.success) promise.success();
      }, 
      fail: function() { promise.failed = arguments; }, 
      async: function() {
        promise.sync = false;
        return promise.next;
      }
    };

    // Adds then method to the promise
    promise.then = function(success, fail) {
      var newPromise = create();
      
      promise.success = function() {
        var value = success.apply(newPromise.next, promise.succeeded); 
        if (newPromise.sync) newPromise.next.success(value);
      };
      if (promise.succeeded) promise.success();
      
      return newPromise;
    };

    return promise;
  };
  
  // Creates a promise and runs it on the function provided
  var promise = create();
  promise.async = true;
  fn.apply(promise.next);
  
  return promise;
}

// Runs a function with asynchronous behaviour on an array of items
async.chain = function(items, fn) {
  return async.promise(function() {
    var next = this.async();
    
    // Runs the function on one item by index
    var iterate = function(fn, i) {
      if (i < items.length) {
        fn.call({
          continue: function() { iterate(fn, i + 1) },
          break: function() { next.success(i + 1); }
        }, items[i]);
      }
      else { next.success(i); }
    };
  
    // Runs the first item
    iterate(fn, 0);
  });
};
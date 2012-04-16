var async = require('./async.js');

//Runs a function with asynchronous behaviour on an array of items
async.promise(function() {
    var next = this;
    setTimeout(function() {
        next.success([1,2,3]);
    }, 0);
})
.then(function(values) { this.success(values[0] + values[1] + values[2]); })
.then(function(value) {
  var next = this;
  setTimeout(function() { next.success(value); }, 10);
})
.then(function(f) { console.log(f); });

//Runs a function with asynchronous behaviour on an array of items
async.map([1,2,3,4,5,6], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item-1);
  }, 10);
})
.then(function(i) { console.log(i.join(",")); });
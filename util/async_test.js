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
.then(function(f) { console.log(f); this.success(); })
.then(function() { console.log("--------------"); });

//Runs a function with asynchronous behaviour on an array of items
async.map([1,2,3,4,5,6], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item-1);
  }, 10);
})
.then(function(i) { console.log(i.join(",")); this.success(); })
.then(function() { console.log("--------------"); });

//Runs a function with asynchronous behaviour on an array of items, twice
async.map([1,2,3], function(item, i) {
  var next = this;
  setTimeout(function() {
    next.success(item);
  }, 50);
})
.map(function(item) { console.log(item); this.success(); })
.then(function() { console.log("--------------"); })

//Runs a function with asynchronous behaviour on an array of items, twice
async.promise(function() {
  var next = this;
  setTimeout(function() {
    next.success([4,5,6]);
  }, 180);
})
.map(function(item) { console.log(item); this.success(item); })
.map(function(item) { console.log(item); this.success(); })
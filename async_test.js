var async = require('./async.js');

//Runs a function with asynchronous behaviour on an array of items
async.promise(function() {
    var next = this;
    setTimeout(function() {
        next.success([1,2,3]);
    }, 0);
})
.then(function(a) { return a[0] + a[1] + a[2]; })
.then(function(d) {
  var next = this.async();
  next.success(d);
})
.then(function(e) {
  var next = this.async();
  setTimeout(function() { next.success(e); }, 0);
})
.then(function(f) { console.log(f); });

//Runs a function with asynchronous behaviour on an array of items
async.map([1,2,3,4,5,6], function(item, i) {
  //Should be: this.async();
  var next = this;
  setTimeout(function() {
    next.success(item-1);
  }, 10);
})
.then(function(i) { console.log(i.join(",")); });
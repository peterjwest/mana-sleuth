var util = exports;

// Gets an array of all the keys of an object
util.values = function(obj) {
  var key, array = [];
  for (key in obj) {
    array.push(obj[key]);
  }
  return array;
};

// Produces a object from an array using a function to choose each key
util.hash = function(array, fn) {
  var obj = {};
  array.map(function(item, key) { obj[fn(item, key)] = item; });
  return obj;
};

// Combines two arrays into an object as key-value pairs
util.zip = function(array, keys) {
  var obj = {};
  array.map(function(item, key) { obj[keys[key]] = item; });
  return obj;
};

// Extracts an array of a particular attribute from an array of objects
util.pluck = function(array, key) {
  var values = [];
  array.map(function(item) { values.push(item[key]); });
  return values;
};

// Gets a random number between a min and max
util.between = function(min, max) { return Math.random()*(max - min) + min };

// Runs a callback after a set amount of time
util.after = function(time, fn) { setTimeout(fn, time); };

// Finds the alternate value in an array of two values
util.alternate = function(array, item) { return array[0] === item ? array[1] : array[0]; };

// Returns an object which finds a key
util.key = function(key) { return function(obj) { return obj[key] }; };
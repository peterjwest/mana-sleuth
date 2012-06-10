var util = exports;

// Gets an array of all the properties of an object
util.values = function(obj) {
  var key, array = [];
  for (key in obj) {
    array.push(obj[key]);
  }
  return array;
};

// Gets an array of all the property names of an object
util.keys = function(obj) {
  var key, array = [];
  for (key in obj) {
    array.push(key);
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

// Creates a shallow clone of an object
util.clone = function(obj) {
  var next = {};
  for (i in obj) next[i] = obj[i];
  return next;
};

// Merges two objects, creating a default if neccessary
util.merge = function(a, b) {
  a = a || {};
  for (i in b) a[i] = b[i];
  return a;
};

// Gets a random number between a min and max
util.between = function(min, max) { return Math.random()*(max - min) + min };

// Runs a callback after a set amount of time
util.after = function(time, fn) { setTimeout(fn, time); };

// Finds the alternate value in an array of two values
util.alternate = function(array, item) { return array[0] === item ? array[1] : array[0]; };

// Returns an object which finds a key
util.key = function(key) { return function(obj) { return obj[key] }; };

// Returning the given object useful for combining with things
util.self = function(item) { return item; };

// Escapes a string for regex
util.regEscape = function(str) { return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"); };

// Escapes a string for regex
util.round = function(num, precision) {
  var multiple = Math.pow(10, precision);
  return Math.round(num * multiple) / multiple;
};
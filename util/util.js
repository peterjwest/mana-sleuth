// Produces an array from an object
module.exports.dehash = function(obj, fn) {
  var array = [];
  for (const key in obj) {
    array.push(fn(obj[key], key));
  };
  return array;
};

// Finds the alternate value in an array of two values
module.exports.alternate = function(array, item) { return array[0] === item ? array[1] : array[0]; };

// Escapes a string for regex
module.exports.regexEscape = function(str) { return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"); };

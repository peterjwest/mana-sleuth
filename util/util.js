// Produces an array from an object
module.exports.dehash = function(obj, fn) {
  var array = [];
  for (const key in obj) {
    array.push(fn(obj[key], key));
  };
  return array;
};

// Escapes a string for regex
module.exports.regexEscape = function(str) { return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"); };

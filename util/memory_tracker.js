var tracker = exports || {};

tracker.usage = 0;
tracker.change = 0;

var megaBytes = function(bytes) { return bytes/1024/1024; }
var round = function(number, precision) {
  var multiple = Math.pow(10, precision);
  return Math.round(number * multiple) / multiple;
};

tracker.update = function() {
  var usage = process.memoryUsage().rss;
  tracker.change = usage - tracker.usage;
  tracker.usage = usage;
};

tracker.log = function() {
  tracker.update();
  var usage = round(megaBytes(tracker.usage), 1);
  var change = round(megaBytes(tracker.change), 1);
  var sign = change >= 0 ? "+" : "";
  console.log("Memory usage: "+usage+" MB ("+sign+change+" MB)");
};
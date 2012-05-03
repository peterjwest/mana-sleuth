var scheduler = exports;

// Time units
var units = [];
units.second = 1000;
units.minute = 60 * units.second;
units.hour = 60 * units.minute;
units.day = 24 * units.hour;
units.week = 7 * units.day;

scheduler.units = units;
scheduler.tasks = {};

scheduler.decodeTime = function(string) {
  var time = string.split(/\s+/);
  var unit = time[1].replace(/s$/, "");
  if (!this.units[unit]) throw "Cannot determine unit of time";
  return parseInt(parseInt(time[0]) * this.units[unit]);
};

scheduler.every = function(time, name, fn) {
  var id = setInterval(fn, this.decodeTime(time));
  this.tasks[name] = {name: name, id: id, fn: fn};
};

scheduler.remove = function(name) {
  clearInterval(this.tasks[name].id);
  delete this.tasks[name];
};

scheduler.trigger = function(name) {
  this.tasks[name]();
};
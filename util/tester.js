var tester = exports;

tester.initialised = false;
tester.tests = {};

tester.count = function(flag, value) {
  var count = 0;
  for (i in tester.tests) if (tester.tests[i][flag] === value) count++;
  return count;
};

tester.start = function(name) {
  if (!name) throw "Test requires a name";
  if (tester.tests[name]) throw "Test already name already used: "+name;
  var test = {name: name, completed: false, passed: false, timeout: false, result: {}};
  tester.tests[name] = test;

  test.timer = setTimeout(function() {
    if (!test.completed) {
      test.timeout = true;
      tester.complete(name);
    }
  }, 2000);
};

tester.complete = function(name, got, expected) {
  var test = tester.tests[name];
  if (!test) throw "Test not found: "+name;
  clearTimeout(test.timer);
  delete test.timer;
  test.completed = true;
  test.passed = arguments.length == 3 && expected === got;
  test.result = {expected: expected, got: got};

  if (tester.initialised && tester.count('completed', false) == 0) {
    tester.print();
  }
};

tester.print = function() {
  var test, result, message;
  tester.initialised = true;
  if (tester.count('completed', false) == 0) {
    for (name in tester.tests) {
      test = tester.tests[name];
      result = test.result;
      if (test.passed) message = "Passed: "+name;
      else {
        message = "Failed: "+name+", ";
        if (test.timeout) message += "timed out"
        else message += "expected: "+result.expected+", got: "+result.got;
      }
      console.log(message);
    }
    var passed = tester.count('passed', true);
    var failed = tester.count('passed', false);
    console.log("Total passed: "+passed+", total failed: "+failed);
  }
};
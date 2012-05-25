var tester = exports;

tester.initialised = false;
tester.tests = {};

tester.running = function() {
  var count = 0;
  for (i in tester.tests) if (!tester.tests[i].completed) count++;
  return count;
};

tester.start = function(name) {
  if (!name) throw "Test requires a name";
  if (tester.tests[name]) throw "Test already name already used: "+name;
  var test = {name: name, completed: false, passed: false, timeout: false, result: {}};
  tester.tests[name] = test;
  setTimeout(function() {
    if (!test.completed) {
      test.timeout = true;
      tester.complete(name);
    }
  }, 2000);
};

tester.complete = function(name, expected, got) {
  var test = tester.tests[name];
  if (!test) throw "Test not found: "+name;
  test.completed = true;
  test.passed = arguments.length == 3 && expected === got;
  test.result = {expected: expected, got: got};

  if (tester.initialised && tester.running() == 0) {
    tester.print();
  }
};

tester.print = function() {
  var test, result;
  tester.initialised = true;
  if (tester.running() == 0) {
    for (name in tester.tests) {
      test = tester.tests[name];
      result = test.result;
      if (test.passed) console.log("Passed: "+name);
      else if (test.timeout) console.log("Timeout: "+name);
      else console.log("Failed: "+name+", expected: "+result.expected+", got: "+result.got);
    }
  }
};
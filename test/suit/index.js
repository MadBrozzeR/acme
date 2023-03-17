function setColor (color) {
  return function (data) {
    return '\033[' + color + 'm' + data + '\033[0m'
  }
}

const COLOR = {
  RED: setColor(31),
  GREEN: setColor(32),
  YELLOW: setColor(33),
  BLUE: setColor('34;1'),
}

function logExpectations (message, expected, received) {
  return message + '\n    EXPECTED:\n      ' + COLOR.GREEN(expected) + '\n    RECEIVED:\n      ' + COLOR.RED(received);
}

const testSuit = {
  equals: function (received, expected, message) {
    if (expected !== received) {
      throw logExpectations(message, expected, received);
    }
  },
  instanceOf: function (received, expected, message) {
    if (received.constructor.name !== expected.name) {
      throw logExpectations(message, expected.name, received.constructor.name);
    }
  },
  checks: function (resolve, reject, cases) {
    let promise = Promise.resolve();

    for (const message in cases) {
      promise = promise.then(function () {
        const result = cases[message]();

        if (result) {
          throw result;
        }
      });
    }

    return promise.then(resolve).catch(reject);
  },
  throwsError: function (procedure, message = '') {
    return new Promise(function (resolve, reject) {
      if (procedure instanceof Promise) {
        procedure
          .then(function () {
            reject(message);
          })
          .catch(resolve);
      } else if (procedure instanceof Function) {
        try {
          procedure();
        } catch (error) {
          resolve(error);
        }

        reject(message);
      }
    });
  }
};

function out(data, error) {
  process.stdout.write(data);

  if (error instanceof Error) {
    console.log(error);
  }
}
function TestSuit (data) {
  this.data = data;
  this.tests = Promise.resolve();
  this.count = 0;
  this.successfull = 0;
  this.suit = testSuit;
}
TestSuit.prototype.test = function (tests, { description = '', spacer = '' } = {}) {
  const suit = this;

  if (tests instanceof Function) {
    suit.count++;
    suit.tests = suit.tests.then(function () {
      out(spacer + description + ': ');

      return new Promise(tests.bind(suit))
        .then(function () {
          out(COLOR.GREEN('DONE\n'));
          suit.successfull++;
        })
        .catch(function (error) {
          out(COLOR.RED('FAILED\n'));
          out(spacer + 'REASON: ' + (error instanceof Error ? error.message : error) + '\n', error);
        });
    });
  } else {
    suit.tests.then(function () {
      out(spacer + description + '\n');
    });

    for (const group in tests) {
      const test = tests[group];

      suit.test(tests[group], { description: group, spacer: spacer + '  ' })
    }
  }

  return this;
}
TestSuit.prototype.result = function (callback) {
  const suit = this;

  this.tests.then(function () {
    const count = '[' + suit.successfull + '/' + suit.count + ']';

    if (suit.successfull === suit.count) {
      out(COLOR.GREEN(count + ' All tests successfully passed\n'));
    } else {
      out(COLOR.RED(count + ' Some tests failed\n'));
    }
  });

  callback && this.tests.then(function () {
    callback(suit.count - suit.successfull);
  });
}

module.exports = { TestSuit };

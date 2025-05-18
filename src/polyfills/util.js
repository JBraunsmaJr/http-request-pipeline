// Browser-compatible polyfill for Node.js util module
// This file provides browser-compatible implementations of Node.js util functions

// Polyfill for util.inherits
// This is a simplified version of the Node.js util.inherits function
// https://github.com/nodejs/node/blob/master/lib/util.js
function inherits(ctor, superCtor) {
  if (ctor === undefined || ctor === null) {
    throw new TypeError('The constructor to "inherits" must not be null or undefined');
  }

  if (superCtor === undefined || superCtor === null) {
    throw new TypeError('The super constructor to "inherits" must not be null or undefined');
  }

  if (superCtor.prototype === undefined) {
    throw new TypeError('The super constructor to "inherits" must have a prototype');
  }

  ctor.super_ = superCtor;
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}

// Export the functions
module.exports = {
  inherits: inherits,
  // Add other util functions as needed
};

// For ES modules
export { inherits };
export default { inherits };
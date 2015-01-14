var critr = require('../../src/critr.js');

// equality
console.log('$eq: %s should be true.',
    critr.test({ name: 'bob' }, { name: { $eq: 'bob' }}));

console.log('$eq: %s should be false.',
    critr.test({ name: 'bob' }, { name: { $eq: 'tim' }}));

console.log('$ne: %s should be false.',
    critr.test({ name: 'bob' }, { name: { $ne: 'bob' }}));

console.log('$ne: %s should be true.',
    critr.test({ name: 'bob' }, { name: { $ne: 'tim' }}));

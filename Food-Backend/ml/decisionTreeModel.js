const { DecisionTreeClassifier } = require('ml-cart');
const { dataset, labels } = require('./data');

const classifier = new DecisionTreeClassifier({ gainFunction: 'gini', maxDepth: 10 });
classifier.train(dataset, labels);
module.exports = classifier;
const KNN = require('ml-knn');
const { dataset, labels } = require('./data');

const knn = new KNN(dataset, labels, { k: 3 });
module.exports = knn;
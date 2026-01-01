// Central export point for all models
const Estate = require('./Estate');
const User = require('./User');
const TrustedContact = require('./TrustedContact');
const PreRegisteredVisitor = require('./PreRegisteredVisitor');
const VisitorLog = require('./VisitorLog');
const Notification = require('./Notification');

module.exports = {
  Estate,
  User,
  TrustedContact,
  PreRegisteredVisitor,
  VisitorLog,
  Notification,
};
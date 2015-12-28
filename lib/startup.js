/**
 * When the application starts up, register handlers!
 */
Meteor.startup(function onStartup() {
  Streamy.init(Streamy._options);
  delete Streamy._options;
});

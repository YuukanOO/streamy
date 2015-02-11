Package.describe({
  name: 'yuukan:streamy',
  version: '0.9.0',
  // Brief, one-line summary of the package.
  summary: 'Simple interface to use the underlying sockjs in a meteor application',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.use('underscore');
  api.addFiles('lib/streamy.js');
  api.add_files('lib/streamy_client.js', 'client');
  api.add_files('lib/streamy_server.js', 'server');
  api.add_files('lib/global_streamy.js');
  api.export('Streamy');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('yuukan:streamy');
  //api.addFiles('yuukan:streamy-tests.js');
});

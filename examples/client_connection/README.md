Client Connection
=================

This example shows how to set Streamy client connection.

1. Start the master Meteor application. Our Streamy clients will connect
   to the Streamy server in this application.

   ```Shell
   $ cd master
   $ meteor
   ```

2. Start the slave Meteor application. The Streamy client in this applcation
   will connect to the master application's Streamy server, not its own.

   ```Shell
   $ cd slave
   $ meteor --port 3002
   ```

3. Open a slave client in a browser (http://localhost:3002). Look at the Master
   server's output. You should see a message from the slave client.


# Hubiquitus ping monitor

This module provides a binary that launches a webapp to monitor alives hubiquitus container in your system.
This webapp provides

  - `/ping/:id/:name` a ping service to collect ping emitted by **hubiquitus-ping** module
  - `/` a service to display the system status
  - `/statusfull` a service that sends a 200 HTTP code if all expected containers are UP, 500 else
  - `/status` a service that sends a 200 HTTP code if at least one container of each type is up, 500 else

Install the module with :

    $ npm install -g hubiquitus-logger-mongo

Note : the `-g` option needs root privileges.

The provided executable is `h-ping-monitor`.
The available options are :

  - -h, --help      output usage information
  - -V, --version   output the version number
  - -p, --port [n]  HTTP port
  - -d, --debug     Debug
  - -f, --file [path]  File containing expected results

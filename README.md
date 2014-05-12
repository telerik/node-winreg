
# node-winreg #


## Summary ##

This [nodejs](http://nodejs.org "nodejs website") package provides
asynchronous access to the Windows Registry through the REG command line interface.


## Installation ##

The following command installs node-winreg.

```shell
npm install winreg 
```

If you prefer to install _without the vows tests and HTML documentation_
(into a production environment for example) you should use the following command.

```shell
npm install winreg --production
```

Note that the development dependencies will not be installed if this package was installed
as a dependency of another package.


## Documentation ##

The documentation is generated using [jsdoc](http://github.com/jsdoc3/jsdoc "jsdoc Website") with
the [docstrap template](http://terryweiss.github.io/docstrap "docstrap website").
You can view the API documentation [online](http://fresc81.github.io/node-winreg "online documentation"),
checkout the latest documentation from GIT or generate it from the sourcecode.


### Online Documentation ###

View the latest docs [online](http://fresc81.github.io/node-winreg "online documentation").


### Download Documentation ###

To download the latest docs from GIT the following command is used.

```shell
npm run-script download-docs
```


### Generate Documentation ###

To generate the docs from the sources you can use the following command.

```shell
npm run-script generate-docs
```

Note that generating the docs requires the development dependencies to be installed.


## Example Usage ##

Let's start with an example. The code below lists the autostart programs of the current user.

```javascript
var Registry = require('winreg')
,   reg = new Registry({
      hive: Winreg.HKCU,                                          // HKEY_CURRENT_USER
      key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' // key containing autostart programs
    })

// list autostart programs
reg.values(function (err, items) {
  if (err)
    console.log('ERROR: '+err);
  else
    for (var i in items)
      console.log('ITEM: '+items[i].name+'\t'+items[i].type+'\t'+items[i].value);
});
```


## Contributions ##

Your contributions are welcome. Please make sure the vows tests are passing without any error,
and the documentation can be generated. Document new features and add tests to the _test_ directory.


## Running Tests ##

This package ships with some tests that can be run using the following command.
For more information about the testing framework used consult the [vows website](http://vowsjs.org/ "vows website").

```shell
npm test
```

Note that running the tests requires the development dependencies to be installed.


## License ##

This project is released under [BSD-2-Clause License](http://opensource.org/licenses/BSD-2-Clause).

Copyright (c) 2014, Paul Bottin <paul.bottin+git@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided
that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the
following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

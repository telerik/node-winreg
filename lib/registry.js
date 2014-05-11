/************************************************************************************************************
 * registry.js - contains a wrapper for the REG command under Windows, which provides access to the registry
 *
 *  author:   Paul Bottin a/k/a FrEsC
 *
 */

/* imports */
var util          = require('util')
,   spawn         = require('child_process').spawn

/* set to console.log for debugging */
,   log           = function() { console.log.apply(console, arguments); }
//,   log           = function () {}

/* registry hive ids */
,   HKLM          = 'HKLM'
,   HKCU          = 'HKCU'
,   HKCR          = 'HKCR'
,   HKU           = 'HKU'
,   HKCC          = 'HKCC'
,   HIVES         = [ HKLM, HKCU, HKCR, HKU, HKCC ]

/* registry value type ids */
,   REG_SZ        = 'REG_SZ'
,   REG_MULTI_SZ  = 'REG_MULTI_SZ'
,   REG_EXPAND_SZ = 'REG_EXPAND_SZ'
,   REG_DWORD     = 'REG_DWORD'
,   REG_QWORD     = 'REG_QWORD'
,   REG_BINARY    = 'REG_BINARY'
,   REG_NONE      = 'REG_NONE'
,   REG_TYPES     = [ REG_SZ, REG_MULTI_SZ, REG_EXPAND_SZ, REG_DWORD, REG_QWORD, REG_BINARY, REG_NONE ]

/* general key pattern */
,   KEY_PATTERN   = /(\\[a-zA-Z0-9_\s]+)*/

/* key path pattern (as returned by REG-cli) */
,   PATH_PATTERN  = /^(HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG)(.*)$/

/* registry item pattern */
,   ITEM_PATTERN  = /^([a-zA-Z0-9_\s\\-]+)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/



/**
 * creates a single registry value record
 * 
 * @private
 * @class
 * 
 * @param {string} host - the hostname
 *
 * @param {string} hive - the hive id
 *
 * @param {string} key - the registry key
 *
 * @param {string} name - the value name
 *
 * @param {string} type - the value type
 *
 * @param {string} value - the value
 *
 */
function RegistryItem (host, hive, key, name, type, value) {

  if (!(this instanceof RegistryItem))
    return new RegistryItem(host, hive, key, name, type, value);

  /* private members */
  var _host = host    // hostname
  ,   _hive = hive    // registry hive
  ,   _key = key      // registry key
  ,   _name = name    // property name
  ,   _type = type    // property type
  ,   _value = value  // property value

  /* getters/setters */
  
  /**
   * the hostname
   * @readonly
   * @member {string} RegistryItem#host
   */
  this.__defineGetter__('host', function () { return _host; });
  
  /**
   * the hive id
   * @readonly
   * @member {string} RegistryItem#hive
   */
  this.__defineGetter__('hive', function () { return _hive; });
  
  /**
   * the registry key
   * @readonly
   * @member {string} RegistryItem#key
   */
  this.__defineGetter__('key', function () { return _key; });
  
  /**
   * the value name
   * @readonly
   * @member {string} RegistryItem#name
   */
  this.__defineGetter__('name', function () { return _name; });
  
  /**
   * the value type
   * @readonly
   * @member {string} RegistryItem#type
   */
  this.__defineGetter__('type', function () { return _type; });
  
  /**
   * the value
   * @readonly
   * @member {string} RegistryItem#value
   */
  this.__defineGetter__('value', function () { return _value; });
  
  Object.freeze(this);
}

util.inherits(RegistryItem, Object);

/* lock RegistryItem class */
Object.freeze(RegistryItem);
Object.freeze(RegistryItem.prototype);



/**
 * creates a registry object, which provides access to a single Registry key
 * 
 * @public
 * @class
 * 
 * @param {object} options - the options
 *
 * @property {string} options.host - the hostname
 * @property {string} options.hive - the hive id
 * @property {string} options.key - the registry key
 *
 */
function Registry (options) {

  if (!(this instanceof Registry))
    return new Registry(options);

  /* private members */
  var _options = options || {}
  ,   _host = '' + (_options.host || '')    // hostname
  ,   _hive = '' + (_options.hive || HKLM)  // registry hive
  ,   _key  = '' + (_options.key  || '')    // registry key

  /* getters/setters */
  
  /**
   * the hostname
   * @readonly
   * @member {string} Registry#host
   */
  this.__defineGetter__('host', function () { return _host; });
  
  /**
   * the hive id
   * @readonly
   * @member {string} Registry#hive
   */
  this.__defineGetter__('hive', function () { return _hive; });
  
  /**
   * the registry key name
   * @readonly
   * @member {string} Registry#key
   */
  this.__defineGetter__('key', function () { return _key; });
  
  /**
   * the full path to the registry key
   * @readonly
   * @member {string} Registry#path
   */
  this.__defineGetter__('path', function () { return (_host.length == 0 ? '' : '\\\\' + host + '\\') + _hive + _key; });
  
  /**
   * the parent registry key
   * @readonly
   * @member {Registry} Registry#parent
   */
  this.__defineGetter__('parent', function () {
    var i = _key.lastIndexOf('\\')
    return new Registry({
      host: this.host,
      hive: this.hive,
      key:  (i == -1)?'':_key.substring(0, i)
    });
  });
  
  // validate options...
  if (HIVES.indexOf(_hive) == -1)
    throw new Error('illegal hive specified.');

  if (!KEY_PATTERN.test(_key))
    throw new Error('illegal key specified.');

  Object.freeze(this);
}

util.inherits(Registry, Object);

/**
 * registry hive key LOCAL_MACHINE
 */
Registry.HKLM = HKLM;

/**
 * registry hive key CURRENT_USER
 */
Registry.HKCU = HKCU;

/**
 * registry hive key CLASSES_ROOT
 */
Registry.HKCR = HKCR;

/**
 * registry hive key USERS
 */
Registry.HKU = HKU;

/**
 * registry hive key CURRENT_CONFIG
 */
Registry.HKCC = HKCC;

/**
 * collection of available registry hive keys
 */
Registry.HIVES = HIVES;

/**
 * registry value type STRING
 */
Registry.REG_SZ = REG_SZ;

/**
 * registry value type MULTILINE_STRING
 */
Registry.REG_MULTI_SZ = REG_MULTI_SZ;

/**
 * registry value type EXPANDABLE_STRING
 */
Registry.REG_EXPAND_SZ = REG_EXPAND_SZ;

/**
 * registry value type DOUBLE_WORD
 */
Registry.REG_DWORD = REG_DWORD;

/**
 * registry value type QUAD_WORD
 */
Registry.REG_QWORD = REG_QWORD;

/**
 * registry value type BINARY
 */
Registry.REG_BINARY = REG_BINARY;

/**
 * registry value type UNKNOWN
 */
Registry.REG_NONE = REG_NONE;

/**
 * collection of available registry value types
 */
Registry.REG_TYPES = REG_TYPES;

/**
 * retrieve all values from this registry key
 * @param {valuesCallback} cb - callback function
 */
Registry.prototype.values = function values (cb) {

  /**
   * This callback receives the items returned by {@link Registry#values}.
   * @function valuesCallback
   * @param {error} err - error object or null if successful
   * @param {array} items - an array of {@link RegistryItem} objects
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = [ 'QUERY', this.path ]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })
  ,   buffer = ''
  ,   self = this

  proc.on('close', function (code) {

    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code), null);
    } else {
      var items = []
      ,   result = []
      ,   lines = buffer.split('\n')
      ,   lineNumber = 0

      for (var line in lines) {
        lines[line] = lines[line].trim();
        if (lines[line].length > 0) {
          log(lines[line]);
          if (lineNumber != 0) {
            items.push(lines[line]);
          }
          ++lineNumber;
        }
      }

      for (var item in items) {

        var match = ITEM_PATTERN.exec(items[item])
        ,   name
        ,   type
        ,   value

        if (match) {
          name = match[1].trim();
          type = match[2].trim();
          value = match[3];
          result.push(new RegistryItem(self.host, self.hive, self.key, name, type, value));
        }
      }

      cb(null, result);

    }
  });

  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });

  return this;
};

/**
 * retrieve all subkeys from this registry key
 * @param {keysCallback} cb - callback function
 */
Registry.prototype.keys = function keys (cb) {

  /**
   * This callback receives the items returned by {@link Registry#keys}.
   * @function keysCallback
   * @param {error} err - error object or null if successful
   * @param {array} items - an array of {@link Registry} objects
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = [ 'QUERY', this.path ]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })
  ,   buffer = ''
  ,   self = this

  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code), null);
    }
  });

  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });

  proc.stdout.on('end', function () {

    var items = []
    ,   result = []
    ,   lines = buffer.split('\n')

    for (var line in lines) {
      lines[line] = lines[line].trim();
      if (lines[line].length > 0) {
        log(lines[line]);
        items.push(lines[line]);
      }
    }

    for (var item in items) {

      var match = PATH_PATTERN.exec(items[item])
      ,   hive
      ,   key

      if (match) {
        hive = match[1];
        key  = match[2];
        if (key && (key !== self.key)) {
          result.push(new Registry({
            host: self.host,
            hive: self.hive,
            key:  key
          }));
        }
      }
    }

    cb(null, result);

  });

  return this;
};

/**
 * retrieve a named value from this registry key
 * @param {string} name - the value name
 * @param {getCallback} cb - callback function
 */
Registry.prototype.get = function get (name, cb) {

  /**
   * This callback receives the item returned by {@link Registry#get}.
   * @function getCallback
   * @param {error} err - error object or null if successful
   * @param {RegistryItem} item - the retrieved registry item
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = [ 'QUERY', this.path, '/v', name ]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })
  ,   buffer = ''
  ,   self = this

  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code), null);
    } else {
      var items = []
      ,   result = null
      ,   lines = buffer.split('\n')
      ,   lineNumber = 0

      for (var line in lines) {
        lines[line] = lines[line].trim();
        if (lines[line].length > 0) {
          log(lines[line]);
          if (lineNumber != 0) {
             items.push(lines[line]);
          }
          ++lineNumber;
        }
      }

      var item = items[0] || ''
      ,   match = ITEM_PATTERN.exec(item)
      ,   name
      ,   type
      ,   value

      if (match) {
        name = match[1].trim();
        type = match[2].trim();
        value = match[3];
        result = new RegistryItem(self.host, self.hive, self.key, name, type, value);
      }

      cb(null, result);
    }
  });

  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });

  return this;
};

/**
 * put a value into this registry key, overwrites existing value
 * @param {string} name - the value name
 * @param {string} type - the value type
 * @param {string} value - the value
 * @param {setCallback} cb - callback function
 */
Registry.prototype.set = function set (name, type, value, cb) {

  /**
   * This callback receives the result of the {@link Registry#set} operation.
   * @function setCallback
   * @param {error} err - error object or null if successful
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  if (REG_TYPES.indexOf(type) == -1)
    throw Error('illegal type specified.');
  
  var args = ['ADD', this.path];
  if (name == '')
    args.push('/ve');
  else
    args = args.concat(['/v', name]);
  
  args = args.concat(['/t', type, '/d', value, '/f']);

  var proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })

  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  return this;
};

/**
 * remove a named value from this registry key
 * @param {string} name - the value name
 * @param {removeCallback} cb - callback function
 */
Registry.prototype.remove = function remove (name, cb) {

  /**
   * This callback receives the result of the {@link Registry#remove} operation.
   * @function removeCallback
   * @param {error} err - error object or null if successful
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = name ? ['DELETE', this.path, '/f', '/v', name] : ['DELETE', this.path, '/f', '/ve']
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })

  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  return this;
};

/**
 * erase this registry key and it's contents
 * @param {eraseCallback} cb - callback function
 */
Registry.prototype.erase = function erase (cb) {

  /**
   * This callback receives the result of the {@link Registry#erase} operation.
   * @function eraseCallback
   * @param {error} err - error object or null if successful
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = ['DELETE', this.path, '/f', '/va']
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })

  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  return this;
};

/**
 * create this registry key
 * @param {createCallback} cb - callback function
 */
Registry.prototype.create = function create (cb) {

  /**
   * This callback receives the result of the {@link Registry#create} operation.
   * @function createCallback
   * @param {error} err - error object or null if successful
   */
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = ['ADD', this.path]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'ignore' ]
      })

  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  return this;
};

module.exports = Registry;

/* lock Registry class */
Object.freeze(Registry);
Object.freeze(Registry.prototype);

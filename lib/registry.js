/************************************************************************************************************
 * registry.js - contains a wrapper for the REG command under Windows, which provides access to the registry
 *
 * @author Paul Bottin a/k/a FrEsC
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
 * Creates a single registry value record.
 * This contructor is private. Objects of this type
 * are created internally and returned by methods of
 * {@link Registry} objects.
 * 
 * @private
 * @class
 * 
 * @param {string} host - the hostname
 * @param {string} hive - the hive id
 * @param {string} key - the registry key
 * @param {string} name - the value name
 * @param {string} type - the value type
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
   * The hostname.
   * @readonly
   * @member {string} RegistryItem#host
   */
  this.__defineGetter__('host', function () { return _host; });
  
  /**
   * The hive id.
   * @readonly
   * @member {string} RegistryItem#hive
   */
  this.__defineGetter__('hive', function () { return _hive; });
  
  /**
   * The registry key.
   * @readonly
   * @member {string} RegistryItem#key
   */
  this.__defineGetter__('key', function () { return _key; });
  
  /**
   * The value name.
   * @readonly
   * @member {string} RegistryItem#name
   */
  this.__defineGetter__('name', function () { return _name; });
  
  /**
   * The value type.
   * @readonly
   * @member {string} RegistryItem#type
   */
  this.__defineGetter__('type', function () { return _type; });
  
  /**
   * The value.
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
 * Creates a registry object, which provides access to a single registry key.
 * 
 * @public
 * @class
 * 
 * @param {object} options - the options
 * @param {object=} options.host - the hostname
 * @param {object=} options.hive - the hive id
 * @param {object=} options.key - the registry key
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
   * The hostname.
   * @readonly
   * @member {string} Registry#host
   */
  this.__defineGetter__('host', function () { return _host; });
  
  /**
   * The hive id.
   * @readonly
   * @member {string} Registry#hive
   */
  this.__defineGetter__('hive', function () { return _hive; });
  
  /**
   * The registry key name.
   * @readonly
   * @member {string} Registry#key
   */
  this.__defineGetter__('key', function () { return _key; });
  
  /**
   * The full path to the registry key.
   * @readonly
   * @member {string} Registry#path
   */
  this.__defineGetter__('path', function () { return (_host.length == 0 ? '' : '\\\\' + host + '\\') + _hive + _key; });
  
  /**
   * The parent registry key.
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
 * Registry hive key LOCAL_MACHINE.
 * @type {string}
 */
Registry.HKLM = HKLM;

/**
 * Registry hive key CURRENT_USER.
 * @type {string}
 */
Registry.HKCU = HKCU;

/**
 * Registry hive key CLASSES_ROOT.
 * @type {string}
 */
Registry.HKCR = HKCR;

/**
 * Registry hive key USERS.
 * @type {string}
 */
Registry.HKU = HKU;

/**
 * Registry hive key CURRENT_CONFIG.
 * @type {string}
 */
Registry.HKCC = HKCC;

/**
 * Collection of available registry hive keys.
 * @type {array}
 */
Registry.HIVES = HIVES;

/**
 * Registry value type STRING.
 * @type {string}
 */
Registry.REG_SZ = REG_SZ;

/**
 * Registry value type MULTILINE_STRING.
 * @type {string}
 */
Registry.REG_MULTI_SZ = REG_MULTI_SZ;

/**
 * Registry value type EXPANDABLE_STRING.
 * @type {string}
 */
Registry.REG_EXPAND_SZ = REG_EXPAND_SZ;

/**
 * Registry value type DOUBLE_WORD.
 * @type {string}
 */
Registry.REG_DWORD = REG_DWORD;

/**
 * Registry value type QUAD_WORD.
 * @type {string}
 */
Registry.REG_QWORD = REG_QWORD;

/**
 * Registry value type BINARY.
 * @type {string}
 */
Registry.REG_BINARY = REG_BINARY;

/**
 * Registry value type UNKNOWN.
 * @type {string}
 */
Registry.REG_NONE = REG_NONE;

/**
 * Collection of available registry value types.
 * @type {array}
 */
Registry.REG_TYPES = REG_TYPES;

/**
 * Retrieve all values from this registry key.
 * @param {valuesCallback} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @param {array=} cb.items - an array of {@link RegistryItem} objects
 * @returns {Registry} this registry key object
 */
Registry.prototype.values = function (cb) {

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
 * Retrieve all subkeys from this registry key.
 * @param {function (err, items)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @param {array=} cb.items - an array of {@link Registry} objects
 * @returns {Registry} this registry key object
 */
Registry.prototype.keys = function (cb) {

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
 * Gets a named value from this registry key.
 * @param {string} name - the value name
 * @param {function (err, item)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @param {RegistryItem=} cb.item - the retrieved registry item
 * @returns {Registry} this registry key object
 */
Registry.prototype.get = function (name, cb) {

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
 * Sets a named value in this registry key, overwriting an already existing value.
 * @param {string} name - the value name
 * @param {string} type - the value type
 * @param {string} value - the value
 * @param {function (err)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @returns {Registry} this registry key object
 */
Registry.prototype.set = function (name, type, value, cb) {

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
 * Remove a named value from this registry key. If name is empty, sets the default value of this key.
 * Note that the key must be existing.
 * @param {string} name - the value name
 * @param {function (err)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @returns {Registry} this registry key object
 */
Registry.prototype.remove = function (name, cb) {

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
 * Remove all subkeys and values (including the default value) from this registry key.
 * @param {function (err)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @returns {Registry} this registry key object
 */
Registry.prototype.erase = function (cb) {

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
 * Create this registry key. Note that this is a no-op if the key already exists.
 * @param {function (err)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @returns {Registry} this registry key object
 */
Registry.prototype.create = function (cb) {

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

/**
 * Delete this key and all subkeys from the registry.
 * @param {function (err)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @returns {Registry} this registry key object
 */
Registry.prototype.delete = function (cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  var args = ['DELETE', this.path, '/f']
  , proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
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
 * Checks if this key already exists.
 * @param {function (err, exists)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @param {boolean=} cb.exists - true if a registry key with this name already exists
 * @returns {Registry} this registry key object
 */
Registry.prototype.keyExists = function (cb) {
  
  this.values(function (err, items) {
    cb(err, err===null?true:false);
  });
  
  return this;
};

/**
 * Checks if a value with the given name already exists within this key.
 * @param {function (err, exists)} cb - callback function
 * @param {error=} cb.err - error object or null if successful
 * @param {boolean=} cb.exists - true if a value with the given name was found in this key
 * @returns {Registry} this registry key object
 */
Registry.prototype.valueExists = function (name, cb) {
  
  this.get(name, function (err, item) {
    cb(err, err===null?true:false);
  });
  
  return this;
};

module.exports = Registry;

/* lock Registry class */
Object.freeze(Registry);
Object.freeze(Registry.prototype);

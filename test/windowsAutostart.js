/************************************************************************************************************
 * test/windowsAutostart.js - checks, if the api can run the windows autostart example from the documentation
 *
 *  author:   Paul Bottin a/k/a FrEsC
 *
 */

var vows = require('vows')
,   assert = require('assert')
,   Registry = require(__dirname+'/../lib/registry.js')

vows.describe('windows autostart').addBatch({
  
  "a registry key, containing this user's autostart programs": {
    
    topic: new Registry({
      hive: Registry.HKCU,
      key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    }),
    
    'host should be an empty string': function (reg) {
      assert.equal (reg.host, '');
    },
    
    'hive should be HKCU': function (reg) {
      assert.equal (reg.hive, Registry.HKCU);
    },
    
    'key should be "\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"': function (reg) {
      assert.equal (reg.key, '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run');
    },
    
    'listing key contents': {
      
      topic: function (reg) {
        reg.values(this.callback);
      },
      
      'should return an array of RegistryItem objects': function (err, values) {
        
        assert.isNull(err);
        assert.isArray(values);
        
        var registryItem;
        for (var value in values) {
          
          registryItem = values[value];
          assert.isObject(registryItem);
          
          assert.isString(registryItem.host);
          assert.isString(registryItem.hive);
          assert.isString(registryItem.key);
          assert.isString(registryItem.name);
          assert.isString(registryItem.type);
          assert.isString(registryItem.value);
          
          console.log(JSON.stringify(registryItem, null, '\t'));
          
        }
        
      }
      
    }
    
  }
  
}).export(module);

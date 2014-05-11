/************************************************************************************************************
 * test/api.js - runs several tests against the api functions
 *
 *  author:   Paul Bottin a/k/a FrEsC
 *
 */

var vows = require('vows')
,   assert = require('assert')
,   Registry = require(__dirname+'/../lib/registry.js')

/*
 * API Summary:
 *
 * Registry#values(cb)
 *  cb:     function (err, items)
 *  items:  RegistryItem[]
 *
 * Registry#keys(cb)
 *  cb:     function (err, items)
 *  items:  Registry[]
 *
 * Registry#get(name, cb)
 *  name:   String
 *  cb:     function (err, item)
 *  item:   RegistryItem
 *
 * Registry#set(name, type, value, cb)
 *  name:   String
 *  type:   String
 *  value:  String
 *  cb:     function (err)
 *
** Registry#has(name, cb)
**  cb:     function (err, exists)
**  exists: Boolean
**
 * Registry#remove(name, cb)
 *  name:   String
 *  cb:     function (err)
 *
X* Registry#erase(cb)
X*  cb:     function (err)
 *
** Registry#delete(cb)
**  cb:     function (err)
**
** Registry#exists(cb)
**  cb:     function (err, exists)
**  exists: Boolean
**
X* Registry#create(cb)
X*  cb:     function (err)
 *
 * err:     null || Error
 *
 */

vows.describe('API').addBatch({
  
  'A new unique Registry key': {
    
    topic: new Registry({
      hive: Registry.HKCU,
      key:  '\\Software\\FrEsC\\node-winreg'
    }),
/*
    'that should not exist': {
      
      topic: function (reg) {
        reg.exists(this.callback);
      },
      
      'does not exist': function (err, exists) {
        assert.isNull(err);
        assert.isFalse(exists);
      }
      
    },
*/
    'has been created': {
      
      topic: function (reg) {
        reg.create(this.callback);
      },
      
      'successfully': function (err, dummy) {
        assert.isNull(err);
      },
      
      'After creation the key': {
        
        topic: function (reg) {
          return reg;
        },
        
        // should only contain the default value
        
        'has been erased': {
          
          topic: function (reg) {
            reg.erase(this.callback);
          },

          'successfully': function (err, dummy) {
            assert.isNull(err);
          },
          
/*
          'After erasure the parent key': {
            
            topic: function (reg) {
              return reg.parent;
            },
            
            // which should be '\\Software\\FrEsC'
            
            'has been deleted': {
              
              topic: function (reg) {
                reg.delete(this.callback);
              },
              
              'successfully': function (err, dummy) {
                assert.isNull(err);
              }
              
            }
            
          }
*/
        }
        
      }
        
    }
    
  }
  
}).export(module);

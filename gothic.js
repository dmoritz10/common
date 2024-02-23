// gothic.js
// 
// gothic wraps google authentication and authorization api's to make the easy
// things easy. it's quite unnecessary: the google apis are more than adequate
// on their own. i created this because i found the documentation unhelpful in 
// solving basic obvious problems.
// 
// with this library, it should be easy to trigger sign-in/sign-up events when
// those are required, but to leverage the auto-signin mechanisms when that is
// a better option.
// 
// most importantly, this offers a clean integration between ui

// import jwt_decode from "jwt-decode";

/**
 * The library methods:
 */

export default {
    load,      // Load all required google libraries from google
    recognize, // test to see if the user is one we recognize
    button,    // construct sign-in/sign-up button
    onetap,    // institute onetap sign-in flow
    observe,   // observe gothic for events
    unobserve, // stop observing gothic for events
    signout,   // sign out of google for this app.
    revoke,    // revoke the users credentials (presumably upon their request)
    user,      // return the user details.
    token,      // test for and refresh client token if necessary
    accessToken // return access token
  };
  
  /**
   * Structures used by the module.
   */
  let google;  // Google's GIS libraries
  let gapi;    // Google's API libraries
  
  /**
   * Maintain state for the app.
   */
  const state = {
    prev:         false,
    loaded:       false,
    cid:          null,
    key:          null,
    scope:        null,
    discovery:    null,
    user:         null,
    accessToken:  null
  };
  
  const obs = []; // Observers, listening for actionable events.
  
  /* ------------------------------------------------------------------------- *\
     Public Implementation
  \* ------------------------------------------------------------------------- */
  
  function load(clientId, apiKey, scope, discovery) {
    state.cid       = clientId;
    state.key       = apiKey;
    state.scope     = scope;
    state.discovery = discovery;
    state.prev = window.localStorage.getItem(`gothic-id`) ? true : false;
    _load_libaries();
  }
  
  function recognize() {
    return state.prev;
  }
  
  function observe(cb) {
    obs.push(cb);
  }
  
  function button(parent_id, params = {}) {
  
    const ctr = document.getElementById(parent_id);
    if (!ctr) {
      throw(new Error(`No container for signin button: '${parent_id}' `));
    }
  
    const options = {
      type:  'standard',
      theme: 'outline',
      size:  'large',
      shape: 'square',
      ...params,
    };
  
    google.accounts.id.renderButton(
      ctr,
      options
    ); 
  }
  
  function onetap() {
    function _handle_prompt_events(evt) {

      console.log('evt', evt)

      // if (evt.isNotDisplayed()) {
      //   if (evt.getNotDisplayedReason() === 'suppressed_by_user') {
      //     _disable();
      //     _notify('onetap_suppressed');
      //   }
      // }
      // if (evt.isSkippedMoment()) {
      //   _notify('onetap_suppressed');
      // }
    }
  
    // google.accounts.id.prompt(_handle_prompt_events);
    google.accounts.id.prompt();
  }
  
  function unobserve(cb) {
    for(let i=0; i < obs.length; i++) {
      if (obs[i] == cb) {
        obs.splice(i,1);
        break;
      }
    }
  }
  
  function signout() {
    _disable();
    _notify('signout');
  }
  
  function revoke() {
    google.accounts.id.revoke(state.user.email, done => {
      _disable();
      _notify('revoke');
    });
  }
  
  function user() {
    return state.user;
  }
  
  async function token(err) {
      await _authorize()
      //await state.tok_client.requestAccessToken({prompt: ''});
  }

  function accessToken() {
      return state.accessToken
  }
  
  /* ------------------------------------------------------------------------- *\
     Private Methods
  \* ------------------------------------------------------------------------- */
  
  /**
   * Ensure that the module is cleared of all prior knowledge of user.
   */
  function _disable() {
    state.user = null;
    window.localStorage.removeItem(`gothic-id`);
    google.accounts.id.disableAutoSelect();
  }
  
  /** 
   * Attempt to authorize the scopes required.
   */
  function _authorize() {
    return new Promise((res,rej) => {
      state.tok_client = google.accounts.oauth2.initTokenClient({
        client_id: state.cid,
        scope: state.scope,
        hint: state.user.email,
        callback: (response) => {
          if (!response.access_token) {
            return rej('authorization-failed');
          }
          state.accessToken = response.access_token
          res();
        }
      });
      state.tok_client.requestAccessToken({prompt: ''});
      
    });
  }
  
  /**
   * Load, AND configure, Google's libraries.
   */
  function _load_libaries() {
    
    let goog_ready = false;
    let gapi_ready = false;
  
    let pass;
    let fail;
  
    let ready = new Promise((res, rej) => {
      pass = res;
      fail = rej;
    });
  
    function _all_ready() {
      if (goog_ready && gapi_ready) {
        pass();
        _notify('loaded');
      }
    }
  
    function _gapi_setup() {
      gapi = window.gapi;
      gapi.load('client', async() => {
        await gapi.client.init({
          apiKey: state.key,
          discoveryDocs: state.discovery,
        });
        gapi_ready = true;
        _all_ready();
      });
    }
  
    function _goog_ready() {
      google = window.google;
      
      google.accounts.id.initialize({
        client_id: state.cid,
        auto_select: true,
        use_fedcm_for_prompt: true,
        callback: _on_response
      });
      
      goog_ready = true;
      _all_ready();
    }
  
    // Identity Library
    const googscr = document.createElement('script');
    googscr.type = 'text/javascript';
    googscr.src = 'https://accounts.google.com/gsi/client';
    googscr.defer = true;
    googscr.onload = _goog_ready;
    googscr.onerror = fail;
    document.getElementsByTagName('head')[0].appendChild(googscr);
    
    const gapiscr = document.createElement('script');
    gapiscr.type = 'text/javascript';
    gapiscr.src = 'https://apis.google.com/js/api.js';
    gapiscr.defer = true;
    gapiscr.onload = _gapi_setup;
    gapiscr.onerror = fail;
    document.getElementsByTagName('head')[0].appendChild(gapiscr);
  
    return ready;
  }
  
  function _notify(type, user = null) {
    obs.forEach((fn) => { fn(type,user); });
  } 
  
  async function _on_response(r) {
  
    state.user = null;
    let event_type = 'unknown';
    if (r && r.credential) {
      try {
        let rawdata = jwt_decode(r.credential);
        // state.user = (({ email, family_name:lastName, given_name:firstName, picture, name:fullName }) => ({ email, family_name, given_name, picture, name}))(rawdata);
        state.user = (({ email, family_name, given_name, picture, name }) => ({ email, family_name, given_name, picture, name}))(rawdata);
        state.emailName = state.user.email.split('@')[0]
        await _authorize();
        window.localStorage.setItem('gothic-id', 'loaded');
        event_type = 'signin';
      } catch (err) {
        if (err === 'auth-failed') {
          event_type = 'auth-failed';
        } else {
          console.log(err);
          event_type = 'error';
        }
      }
    }
  
    _notify(event_type, state.user);
  }
  
  function parseJwt (token) {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
  }
  
  // jwt_decode Library
  (function (factory) {
      typeof define === 'function' && define.amd ? define(factory) :
      factory();
  }((function () { 'use strict';
  
      /**
       * The code was extracted from:
       * https://github.com/davidchambers/Base64.js
       */
  
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  
      function InvalidCharacterError(message) {
          this.message = message;
      }
  
      InvalidCharacterError.prototype = new Error();
      InvalidCharacterError.prototype.name = "InvalidCharacterError";
  
      function polyfill(input) {
          var str = String(input).replace(/=+$/, "");
          if (str.length % 4 == 1) {
              throw new InvalidCharacterError(
                  "'atob' failed: The string to be decoded is not correctly encoded."
              );
          }
          for (
              // initialize result and counters
              var bc = 0, bs, buffer, idx = 0, output = "";
              // get next character
              (buffer = str.charAt(idx++));
              // character found in table? initialize bit storage and add its ascii value;
              ~buffer &&
              ((bs = bc % 4 ? bs * 64 + buffer : buffer),
                  // and if not first of each 4 characters,
                  // convert the first 8 bits to one ascii character
                  bc++ % 4) ?
              (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) :
              0
          ) {
              // try to find character in table (0-63, not found => -1)
              buffer = chars.indexOf(buffer);
          }
          return output;
      }
  
      var atob = (typeof window !== "undefined" &&
          window.atob &&
          window.atob.bind(window)) ||
      polyfill;
  
      function b64DecodeUnicode(str) {
          return decodeURIComponent(
              atob(str).replace(/(.)/g, function(m, p) {
                  var code = p.charCodeAt(0).toString(16).toUpperCase();
                  if (code.length < 2) {
                      code = "0" + code;
                  }
                  return "%" + code;
              })
          );
      }
  
      function base64_url_decode(str) {
          var output = str.replace(/-/g, "+").replace(/_/g, "/");
          switch (output.length % 4) {
              case 0:
                  break;
              case 2:
                  output += "==";
                  break;
              case 3:
                  output += "=";
                  break;
              default:
                  throw "Illegal base64url string!";
          }
  
          try {
              return b64DecodeUnicode(output);
          } catch (err) {
              return atob(output);
          }
      }
  
      function InvalidTokenError(message) {
          this.message = message;
      }
  
      InvalidTokenError.prototype = new Error();
      InvalidTokenError.prototype.name = "InvalidTokenError";
  
      function jwtDecode(token, options) {
          if (typeof token !== "string") {
              throw new InvalidTokenError("Invalid token specified");
          }
  
          options = options || {};
          var pos = options.header === true ? 0 : 1;
          try {
              return JSON.parse(base64_url_decode(token.split(".")[pos]));
          } catch (e) {
              throw new InvalidTokenError("Invalid token specified: " + e.message);
          }
      }
  
      /*
       * Expose the function on the window object
       */
  
      //use amd or just through the window object.
      if (window) {
          if (typeof window.define == "function" && window.define.amd) {
              window.define("jwt_decode", function() {
                  return jwtDecode;
              });
          } else if (window) {
              window.jwt_decode = jwtDecode;
          }
      }
  
  })));
  
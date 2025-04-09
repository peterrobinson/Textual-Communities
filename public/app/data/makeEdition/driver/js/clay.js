(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.clay = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utils = require("./utils");

var _libElementResizeEvent = require('./lib/element-resize-event');

var _libElementResizeEvent2 = _interopRequireDefault(_libElementResizeEvent);

var _exportable = require("exportable");

var _exportable2 = _interopRequireDefault(_exportable);

var Clay = function Clay() {
  var Clay = (function () {
    function Clay(selector, options) {
      _classCallCheck(this, Clay);

      var defaults = { resize: "both", absolute: false };
      var style;

      this.selector = selector;
      this.el = typeof selector === 'string' ? (0, _utils.$)(selector) : selector;
      this.options = (0, _utils.extend)(defaults, options);
      this.eventHanlers = {};

      style = this.el.style;

      //TODO: Improve way of get initial styles
      this.initialStyles = {
        resize: style.resize,
        overflow: style.overflow,
        top: style.top,
        left: style.left,
        margin: style.margin,
        position: style.position
      };

      this.el.style.resize = this.options.resize;
      this.el.style.overflow = "auto";

      if (this.options.absolute) {
        this.cloneElement();
      }

      this.addEvents();
    }

    _createClass(Clay, [{
      key: "addEvents",
      value: function addEvents() {
        (0, _libElementResizeEvent2["default"])(this.el, (function () {
          var cb = this.eventHanlers['resize'];
          if (!cb) return;

          var size = this.el.getBoundingClientRect();

          cb(size, this.el);
        }).bind(this));
      }

      /**
       * Registers an event handler
       * @param  {string}   eventName 
       * @param  {Function} cb        
       * @return {Object}   instance
       */
    }, {
      key: "on",
      value: function on(eventName, cb) {
        this.eventHanlers[eventName] = cb;

        return this;
      }

      /**
       * Creates a fake element and places it in the same position of the original one
       * TODO: Avoid Re-paints --> Use style.cssText
       * TODO: Remove function from Class
       * @return {void} 
       */
    }, {
      key: "cloneElement",
      value: function cloneElement() {
        var fake = this.el.cloneNode();
        var rect = this.el.getBoundingClientRect();
        var top = this.el.offsetTop;
        var left = this.el.offsetLeft;

        this.el.style.top = top + 'px';
        this.el.style.left = left + 'px';
        this.el.style.margin = 0;
        this.el.style.position = "absolute";

        fake.innerHTML = "";
        fake.id = '';
        fake.className = '';
        fake.style.visibility = 'hidden';
        fake.style.height = rect.height + 'px';
        fake.style.width = rect.width + 'px';

        this.el.parentNode.insertBefore(fake, this.el);
      }

      /**
       * TODO: Reset properly when using "absolute: true" param
       * TODO: Remove "fake" associated element if exist
       *
       * Reset element to previous status
       * @return {void} 
       */
    }, {
      key: "reset",
      value: function reset() {
        this.el.style.resize = this.initialStyles.resize;
        this.el.style.overflow = this.initialStyles.overflow;
      }
    }]);

    return Clay;
  })();

  return Clay;
};

(0, _exportable2["default"])({
  module: module,
  name: 'Clay',
  definition: Clay
});

},{"./lib/element-resize-event":2,"./utils":4,"exportable":3}],2:[function(require,module,exports){
'use strict';

module.exports = function (element, fn) {
  var document = window.document;

  var attachEvent = document.attachEvent;
  if (typeof navigator !== "undefined") {
    var isIE = navigator.userAgent.match(/Trident/);
  }

  var requestFrame = (function () {
    var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function (fn) {
      return window.setTimeout(fn, 20);
    };
    return function (fn) {
      return raf(fn);
    };
  })();

  var cancelFrame = (function () {
    var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
    return function (id) {
      return cancel(id);
    };
  })();

  function resizeListener(e) {
    var win = e.target || e.srcElement;
    if (win.__resizeRAF__) {
      cancelFrame(win.__resizeRAF__);
    }
    win.__resizeRAF__ = requestFrame(function () {
      var trigger = win.__resizeTrigger__;
      trigger.__resizeListeners__.forEach(function (fn) {
        fn.call(trigger, e);
      });
    });
  }

  function objectLoad(e) {
    this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__;
    this.contentDocument.defaultView.addEventListener('resize', resizeListener);
  }

  if (!element.__resizeListeners__) {
    element.__resizeListeners__ = [];
    if (attachEvent) {
      element.__resizeTrigger__ = element;
      element.attachEvent('onresize', resizeListener);
    } else {
      if (getComputedStyle(element).position == 'static') {
        element.style.position = 'relative';
      }
      var obj = element.__resizeTrigger__ = document.createElement('object');
      obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
      obj.setAttribute('class', 'resize-sensor');
      obj.__resizeElement__ = element;
      obj.onload = objectLoad;
      obj.type = 'text/html';
      if (isIE) {
        element.appendChild(obj);
      }
      obj.data = 'about:blank';
      if (!isIE) {
        element.appendChild(obj);
      }
    }
  }
  element.__resizeListeners__.push(fn);
};

},{}],3:[function(require,module,exports){
'use strict';

module.exports = function (options) {
  var module = options.module;
  var name = options.name; 
  var definition = options.definition;

	if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(definition);
  } 

  if (typeof window != 'undefined') {
    // Global Variables
    window[name] = definition();
  }
};
},{}],4:[function(require,module,exports){
"use strict";

function extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}

function $(selector) {
  return document.querySelector(selector);
}

function raf() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
}

module.exports = {
  extend: extend,
  $: $,
  raf: raf
};

},{}]},{},[1])(1)
});
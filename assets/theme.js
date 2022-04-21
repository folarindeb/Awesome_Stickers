/*
Streamline by Archetype Themes (https://archetypethemes.co)
  Access unminified JS in assets/theme.js

  Use our custom event listeners to tap into common functions.
  Documentation - https://archetypethemes.co/blogs/streamline/javascript-events-for-developers

  document.addEventListener('page:loaded', function() {
    // Stylesheet and theme scripts have loaded
  });
*/

window.theme = window.theme || {};

// Breakpoint values are used throughout many templates.
// We strongly suggest not changing them globally.
theme.bp = {};
theme.bp.smallUp = 769;
theme.bp.small = theme.bp.smallUp - 1;

theme.config = {
  cssLoaded: false,
  bpSmall: false,
  hasSessionStorage: true,
  mediaQuerySmall: 'screen and (max-width: '+ theme.bp.small +'px)',
  mediaQuerySmallUp: 'screen and (min-width: '+ theme.bp.smallUp +'px)',
  youTubeReady: false,
  vimeoReady: false,
  vimeoLoading: false,
  isSafari: !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/),
  isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
  rtl: document.documentElement.getAttribute('dir') == 'rtl' ? true : false
};

if (console && console.log) {
  console.log('Streamline theme ('+theme.settings.themeVersion+') by ARCHΞTYPE | Learn more at https://archetypethemes.co');
}

window.lazySizesConfig = window.lazySizesConfig || {};
lazySizesConfig.expFactor = 4;

(function($){
  var $ = jQuery = $;

  theme.utils = {
    /**
     * _.defaultTo from lodash
     * Checks `value` to determine whether a default value should be returned in
     * its place. The `defaultValue` is returned if `value` is `NaN`, `null`,
     * or `undefined`.
     * Source: https://github.com/lodash/lodash/blob/master/defaultTo.js
     *
     * @param {*} value - Value to check
     * @param {*} defaultValue - Default value
     * @returns {*} - Returns the resolved value
     */
    defaultTo: function(value, defaultValue) {
      return (value == null || value !== value) ? defaultValue : value
    },
  
    promiseStylesheet: function() {
      if (typeof this.stylesheetPromise === 'undefined') {
        this.stylesheetPromise = $.Deferred(function(defer) {
          var link = document.querySelector('link[href="' + theme.stylesheet + '"]');
  
          if (link.loaded) {
            defer.resolve();
          }
  
          onloadCSS(link, function() { // Global onloadCSS function injected by load-css.liquid
            defer.resolve();
          });
        });
      }
  
      return this.stylesheetPromise;
    }
  };
  
  theme.a11y = {
  
    /**
       * Traps the focus in a particular container
       *
       * @param {object} options - Options to be used
       * @param {jQuery} options.$container - Container to trap focus within
       * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
       * @param {string} options.namespace - Namespace used for new focus event handler
       */
      trapFocus: function(options) {
        var eventsName = {
          focusin: options.namespace ? 'focusin.' + options.namespace : 'focusin',
          focusout: options.namespace
            ? 'focusout.' + options.namespace
            : 'focusout',
          keydown: options.namespace
            ? 'keydown.' + options.namespace
            : 'keydown.handleFocus'
        };
  
        /**
         * Get every possible visible focusable element
         */
        var $focusableElements = options.$container.find(
          $(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])'
          ).filter(':visible')
        );
        var firstFocusable = $focusableElements[0];
        var lastFocusable = $focusableElements[$focusableElements.length - 1];
  
        if (!options.$elementToFocus) {
          options.$elementToFocus = options.$container;
        }
  
        function _manageFocus(evt) {
          // Tab key
          if (evt.keyCode !== 9) return;
  
          /**
           * On the last focusable element and tab forward,
           * focus the first element.
           */
          if (evt.target === lastFocusable && !evt.shiftKey) {
            evt.preventDefault();
            firstFocusable.focus();
          }
          /**
           * On the first focusable element and tab backward,
           * focus the last element.
           */
          if (evt.target === firstFocusable && evt.shiftKey) {
            evt.preventDefault();
            lastFocusable.focus();
          }
        }
  
        options.$container.attr('tabindex', '-1');
        options.$elementToFocus.focus();
  
        $(document).off('focusin');
  
        $(document).on(eventsName.focusout, function() {
          $(document).off(eventsName.keydown);
        });
  
        $(document).on(eventsName.focusin, function(evt) {
          if (evt.target !== lastFocusable && evt.target !== firstFocusable) return;
  
          $(document).on(eventsName.keydown, function(evt) {
            _manageFocus(evt);
          });
        });
      },
  
    /**
     * Removes the trap of focus in a particular container
     *
     * @param {object} options - Options to be used
     * @param {jQuery} options.$container - Container to trap focus within
     * @param {string} options.namespace - Namespace used for new focus event handler
     */
    removeTrapFocus: function(options) {
      var eventName = options.namespace
        ? 'focusin.' + options.namespace
        : 'focusin';
  
      if (options.$container && options.$container.length) {
        options.$container.removeAttr('tabindex');
      }
  
      $(document).off(eventName);
    },
  
    lockMobileScrolling: function(namespace, $element) {
      if ($element) {
        var $el = $element;
      } else {
        var $el = $(document.documentElement).add('body');
      }
      $el.on('touchmove' + namespace, function () {
        return false;
      });
    },
  
    unlockMobileScrolling: function(namespace, $element) {
      if ($element) {
        var $el = $element;
      } else {
        var $el = $(document.documentElement).add('body');
      }
      $el.off(namespace);
    },
  
    promiseAnimationEnd: function($el) {
      var events = 'animationend webkitAnimationEnd oAnimationEnd';
      var properties = ['animation-duration', '-moz-animation-duration', '-webkit-animation-duration', '-o-animation-duration'];
      var duration = 0;
      var promise = $.Deferred().resolve();
  
      // check the various CSS properties to see if a duration has been set
      $.each(properties, function(index, value) {
        duration || (duration = parseFloat($el.css(value)));
      });
  
      if (duration > 0) {
        promise = $.Deferred(function(defer) {
          $el.on(events, function(evt) {
            if (evt.target !== $el[0]) return;
            $el.off(events);
            defer.resolve();
          });
        });
      }
  
      return promise;
    },
  
    promiseTransitionEnd: function($el) {
      var events = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
      var properties = ['transition-duration', '-moz-transition-duration', '-webkit-transition-duration', '-o-transition-duration'];
      var duration = 0;
      var promise = $.Deferred().resolve();
  
      // check the various CSS properties to see if a duration has been set
      $.each(properties, function(index, value) {
        duration || (duration = parseFloat($el.css(value)));
      });
  
      if (duration > 0) {
        promise = $.Deferred(function(defer) {
          $el.on(events, function(evt) {
            if (evt.target !== $el[0]) return;
            $el.off(events);
            defer.resolve();
          });
        });
      }
  
      return promise;
    }
  };
  
  theme.Sections = function Sections() {
    this.constructors = {};
    this.instances = [];
  
    $(document)
      .on('shopify:section:load', this._onSectionLoad.bind(this))
      .on('shopify:section:unload', this._onSectionUnload.bind(this))
      .on('shopify:section:select', this._onSelect.bind(this))
      .on('shopify:section:deselect', this._onDeselect.bind(this))
      .on('shopify:block:select', this._onBlockSelect.bind(this))
      .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
  };
  
  theme.Sections.prototype = $.extend({}, theme.Sections.prototype, {
    createInstance: function(container, constructor, customScope) {
      var $container = $(container);
      var id = $container.attr('data-section-id');
      var type = $container.attr('data-section-type');
  
      constructor = constructor || this.constructors[type];
  
      if (typeof constructor === 'undefined') {
        return;
      }
  
      // If custom scope passed, check to see if instance
      // is already initialized so we don't double up
      if (customScope) {
        var instanceExists = this._findInstance(id);
        if (instanceExists) {
          return;
        }
      }
  
      var instance = $.extend(new constructor(container), {
        id: id,
        type: type,
        container: container,
        namespace: '.' + type + '-' + id
      });
  
      this.instances.push(instance);
    },
  
    _onSectionLoad: function(evt, subSection, subSectionId) {
      if (AOS) {
        AOS.refreshHard();
      }
  
      var container = subSection ? subSection : $('[data-section-id]', evt.target)[0];
  
      if (!container) {
        return;
      }
  
      this.createInstance(container);
  
      var instance = subSection ? subSectionId : this._findInstance(evt.detail.sectionId);
  
      if (!subSection) {
        this.loadSubSections();
      }
  
      // Run JS only in case of the section being selected in the editor
      // before merchant clicks "Add"
      if (instance && typeof instance.onLoad === 'function') {
        instance.onLoad(evt);
      }
    },
  
    loadSubSections: function($context) {
      var $sections = $context ? $context.find('[data-subsection]') : $('[data-subsection]');
  
      $sections.each(function(evt, el) {
        this._onSectionLoad(null, el, $(el).data('section-id'));
      }.bind(this));
  
      if (AOS) {
        AOS.refreshHard();
      }
    },
  
    _onSectionUnload: function(evt) {
      var instance = this._removeInstance(evt.detail.sectionId);
      if (instance && typeof instance.onUnload === 'function') {
        instance.onUnload(evt);
      }
    },
  
    _onSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (instance && typeof instance.onSelect === 'function') {
        instance.onSelect(evt);
      }
    },
  
    _onDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (instance && typeof instance.onDeselect === 'function') {
        instance.onDeselect(evt);
      }
    },
  
    _onBlockSelect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (instance && typeof instance.onBlockSelect === 'function') {
        instance.onBlockSelect(evt);
      }
    },
  
    _onBlockDeselect: function(evt) {
      var instance = this._findInstance(evt.detail.sectionId);
  
      if (instance && typeof instance.onBlockDeselect === 'function') {
        instance.onBlockDeselect(evt);
      }
    },
  
    _findInstance: function(id) {
      for (var i = 0; i < this.instances.length; i++) {
        if (this.instances[i].id === id) {
          return this.instances[i];
        }
      }
    },
  
    _removeInstance: function(id) {
      var i = this.instances.length;
      var instance;
  
      while(i--) {
        if (this.instances[i].id === id) {
          instance = this.instances[i];
          this.instances.splice(i, 1);
          break;
        }
      }
  
      return instance;
    },
  
    reinitSection: function(section) {
      for (var i = 0; i < sections.instances.length; i++) {
        var instance = sections.instances[i];
        if (instance['type'] === section) {
          if (typeof instance.forceReload === 'function') {
            instance.forceReload();
          }
        }
      }
    },
  
    register: function(type, constructor, $scope) {
      var afterLoad = false;
      this.constructors[type] = constructor;
      var $sections = $('[data-section-type=' + type + ']');
  
      // Any section within the scope
      if ($scope) {
        $sections = $('[data-section-type=' + type + ']', $scope);
      }
  
      $sections.each(function(index, container) {
        this.createInstance(container, constructor, $scope);
      }.bind(this));
    }
  });
  
  theme.Currency = (function() {
    var moneyFormat = '${{amount}}';
  
    function formatMoney(cents, format) {
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      var value = '';
      var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      var formatString = (format || moneyFormat);
  
      function formatWithDelimiters(number, precision, thousands, decimal) {
        precision = theme.utils.defaultTo(precision, 2);
        thousands = theme.utils.defaultTo(thousands, ',');
        decimal = theme.utils.defaultTo(decimal, '.');
  
        if (isNaN(number) || number == null) {
          return 0;
        }
  
        number = (number / 100.0).toFixed(precision);
  
        var parts = number.split('.');
        var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        var centsAmount = parts[1] ? (decimal + parts[1]) : '';
  
        return dollarsAmount + centsAmount;
      }
  
      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ');
          break;
      }
  
      return formatString.replace(placeholderRegex, value);
    }
  
    function getBaseUnit(variant) {
      if (!variant) {
        return;
      }
  
      if (!variant.unit_price_measurement || !variant.unit_price_measurement.reference_value) {
        return;
      }
  
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }
  
    return {
      formatMoney: formatMoney,
      getBaseUnit: getBaseUnit
    }
  })();
  
  
  /**
   * Image Helper Functions
   * -----------------------------------------------------------------------------
   * A collection of functions that help with basic image operations.
   *
   */
  
  theme.Images = (function() {
  
    /**
     * Find the Shopify image attribute size
     *
     * @param {string} src
     * @returns {null}
     */
    function imageSize(src) {
      if (!src) {
        return '620x'; // default based on theme
      }
  
      var match = src.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
  
      if (match !== null) {
        return match[1];
      } else {
        return null;
      }
    }
  
    /**
     * Adds a Shopify size attribute to a URL
     *
     * @param src
     * @param size
     * @returns {*}
     */
    function getSizedImageUrl(src, size) {
      if (size == null) {
        return src;
      }
  
      if (size === 'master') {
        return this.removeProtocol(src);
      }
  
      var match = src.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);
  
      if (match != null) {
        var prefix = src.split(match[0]);
        var suffix = match[0];
  
        return this.removeProtocol(prefix[0] + '_' + size + suffix);
      }
  
      return null;
    }
  
    function removeProtocol(path) {
      return path.replace(/http(s)?:/, '');
    }
  
    return {
      imageSize: imageSize,
      getSizedImageUrl: getSizedImageUrl,
      removeProtocol: removeProtocol
    };
  })();
  
  theme.Variants = (function() {
  
    function Variants(options) {
      this.$container = options.$container;
      this.variants = options.variants;
      this.singleOptionSelector = options.singleOptionSelector;
      this.originalSelectorId = options.originalSelectorId;
      this.enableHistoryState = options.enableHistoryState;
      this.currentVariant = this._getVariantFromOptions();
  
      $(this.singleOptionSelector, this.$container).on('change', this._onSelectChange.bind(this));
    }
  
    Variants.prototype = $.extend({}, Variants.prototype, {
  
      _getCurrentOptions: function() {
        var currentOptions = $.map($(this.singleOptionSelector, this.$container), function(element) {
          var $element = $(element);
          var type = $element.attr('type');
          var currentOption = {};
  
          if (type === 'radio' || type === 'checkbox') {
            if ($element[0].checked) {
              currentOption.value = $element.val();
              currentOption.index = $element.data('index');
  
              return currentOption;
            } else {
              return false;
            }
          } else {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');
  
            return currentOption;
          }
        });
  
        // remove any unchecked input values if using radio buttons or checkboxes
        currentOptions = this._compact(currentOptions);
  
        return currentOptions;
      },
  
      _getVariantFromOptions: function() {
        var selectedValues = this._getCurrentOptions();
        var variants = this.variants;
        var found = false;
  
        variants.forEach(function(variant) {
          var match = true;
          var options = variant.options;
  
          selectedValues.forEach(function(option) {
            if (match) {
              match = (variant[option.index] === option.value);
            }
          });
  
          if (match) {
            found = variant;
          }
        });
  
        return found || null;
      },
  
      _onSelectChange: function() {
        var variant = this._getVariantFromOptions();
  
        this.$container.trigger({
          type: 'variantChange',
          variant: variant
        });
  
        document.dispatchEvent(new CustomEvent('variant:change', {
          detail: {
            variant: variant
          }
        }));
  
        if (!variant) {
          return;
        }
  
        this._updateMasterSelect(variant);
        this._updateImages(variant);
        this._updatePrice(variant);
        this._updateUnitPrice(variant);
        this._updateSKU(variant);
        this.currentVariant = variant;
  
        if (this.enableHistoryState) {
          this._updateHistoryState(variant);
        }
      },
  
      _updateImages: function(variant) {
        var variantImage = variant.featured_image || {};
        var currentVariantImage = this.currentVariant.featured_image || {};
  
        if (!variant.featured_image || variantImage.src === currentVariantImage.src) {
          return;
        }
  
        this.$container.trigger({
          type: 'variantImageChange',
          variant: variant
        });
      },
  
      _updatePrice: function(variant) {
        if (variant.price === this.currentVariant.price && variant.compare_at_price === this.currentVariant.compare_at_price) {
          return;
        }
  
        this.$container.trigger({
          type: 'variantPriceChange',
          variant: variant
        });
      },
  
      _updateUnitPrice: function(variant) {
        if (variant.unit_price === this.currentVariant.unit_price) {
          return;
        }
  
        this.$container.trigger({
          type: 'variantUnitPriceChange',
          variant: variant
        });
      },
  
      _updateSKU: function(variant) {
        if (variant.sku === this.currentVariant.sku) {
          return;
        }
  
        this.$container.trigger({
          type: 'variantSKUChange',
          variant: variant
        });
      },
  
      _updateHistoryState: function(variant) {
        if (!history.replaceState || !variant) {
          return;
        }
  
        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({path: newurl}, '', newurl);
      },
  
      _updateMasterSelect: function(variant) {
        $(this.originalSelectorId, this.$container).val(variant.id);
      },
  
      // _.compact from lodash
      // https://github.com/lodash/lodash/blob/4d4e452ade1e78c7eb890968d851f837be37e429/compact.js
      _compact: function(array) {
        var index = -1,
            length = array == null ? 0 : array.length,
            resIndex = 0,
            result = [];
  
        while (++index < length) {
          var value = array[index];
          if (value) {
            result[resIndex++] = value;
          }
        }
        return result;
      }
    });
  
    return Variants;
  })();
  
  theme.rte = {
    init: function() {
      theme.rte.wrapTable();
      theme.rte.wrapVideo();
      theme.rte.imageLinks();
    },
  
    wrapTable: function() {
      $('.rte table').wrap('<div class="table-wrapper"></div>');
    },
  
    wrapVideo: function() {
      var $iframeVideo = $('.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]');
      var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');
  
      $iframeVideo.each(function () {
        // Add wrapper to make video responsive
        if (!$(this).parents('.video-wrapper').length) {
          $(this).wrap('<div class="video-wrapper"></div>');
        }
      });
  
      $iframeReset.each(function () {
        // Re-set the src attribute on each iframe after page load
        // for Chrome's "incorrect iFrame content on 'back'" bug.
        // https://code.google.com/p/chromium/issues/detail?id=395791
        // Need to specifically target video and admin bar
        this.src = this.src;
      });
    },
  
    // Remove CSS that adds animated underline under image links
    imageLinks: function() {
      $('.rte a img').parent().addClass('rte__image');
    }
  };
  
  theme.LibraryLoader = (function() {
    var types = {
      link: 'link',
      script: 'script'
    };
  
    var status = {
      requested: 'requested',
      loaded: 'loaded'
    };
  
    var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';
  
    var libraries = {
      youtubeSdk: {
        tagId: 'youtube-sdk',
        src: 'https://www.youtube.com/iframe_api',
        type: types.script
      },
      shopifyXr: {
        tagId: 'shopify-model-viewer-xr',
        src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
        type: types.script
      },
      modelViewerUi: {
        tagId: 'shopify-model-viewer-ui',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
        type: types.script
      },
      modelViewerUiStyles: {
        tagId: 'shopify-model-viewer-ui-styles',
        src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
        type: types.link
      }
    };
  
    function load(libraryName, callback) {
      var library = libraries[libraryName];
  
      if (!library) return;
      if (library.status === status.requested) return;
  
      callback = callback || function() {};
      if (library.status === status.loaded) {
        callback();
        return;
      }
  
      library.status = status.requested;
  
      var tag;
  
      switch (library.type) {
        case types.script:
          tag = createScriptTag(library, callback);
          break;
        case types.link:
          tag = createLinkTag(library, callback);
          break;
      }
  
      tag.id = library.tagId;
      library.element = tag;
  
      var firstScriptTag = document.getElementsByTagName(library.type)[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  
    function createScriptTag(library, callback) {
      var tag = document.createElement('script');
      tag.src = library.src;
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }
  
    function createLinkTag(library, callback) {
      var tag = document.createElement('link');
      tag.href = library.src;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      tag.addEventListener('load', function() {
        library.status = status.loaded;
        callback();
      });
      return tag;
    }
  
    return {
      load: load
    };
  })();
  

  theme.Modals = (function() {
    function Modal(id, name, options) {
      var defaults = {
        close: '.js-modal-close',
        open: '.js-modal-open-' + name,
        openClass: 'modal--is-active',
        bodyOpenClass: 'modal-open',
        closeOffContentClick: true
      };
  
      this.id = id;
      this.$modal = $('#' + id);
  
      if (!this.$modal.length) {
        return false;
      }
  
      this.nodes = {
        $parent: $('html').add('body'),
        $modalContent: this.$modal.find('.modal__inner')
      };
  
      this.config = $.extend(defaults, options);
      this.modalIsOpen = false;
      this.$focusOnOpen = this.config.focusOnOpen ? $(this.config.focusOnOpen) : this.$modal;
  
      this.init();
    }
  
    Modal.prototype.init = function() {
      var $openBtn = $(this.config.open);
  
      // Add aria controls
      $openBtn.attr('aria-expanded', 'false');
  
      $(this.config.open).on('click', this.open.bind(this));
      this.$modal.find(this.config.close).on('click', this.close.bind(this));
  
      // Close modal if a drawer is opened
      $('body').on('drawerOpen', function() {
        this.close();
      }.bind(this));
    };
  
    Modal.prototype.open = function(evt) {
      // Keep track if modal was opened from a click, or called by another function
      var externalCall = false;
  
      // don't open an opened modal
      if (this.modalIsOpen) {
        return;
      }
  
      // Prevent following href if link is clicked
      if (evt) {
        evt.preventDefault();
      } else {
        externalCall = true;
      }
  
      // Without this, the modal opens, the click event bubbles up to $nodes.page
      // which closes the modal.
      if (evt && evt.stopPropagation) {
        evt.stopPropagation();
        // save the source of the click, we'll focus to this on close
        this.$activeSource = $(evt.currentTarget).attr('aria-expanded', 'true');
      }
  
      if (this.modalIsOpen && !externalCall) {
        this.close();
      }
  
      this.$modal.addClass(this.config.openClass);
      this.nodes.$parent.addClass(this.config.bodyOpenClass);
  
      setTimeout(function() {
        this.$modal.addClass('aos-animate');
      }.bind(this), 0);
  
      this.modalIsOpen = true;
  
      theme.a11y.trapFocus({
        $container: this.$modal,
        $elementToFocus: this.$focusOnOpen,
        namespace: 'modal_focus'
      });
  
      $('body').trigger('modalOpen.' + this.id);
  
      this.bindEvents();
    };
  
    Modal.prototype.close = function() {
      // don't close a closed modal
      if (!this.modalIsOpen) {
        return;
      }
  
      // deselect any focused form elements
      $(document.activeElement).trigger('blur');
  
      this.$modal.removeClass(this.config.openClass).removeClass('aos-animate');
      this.nodes.$parent.removeClass(this.config.bodyOpenClass);
  
      this.modalIsOpen = false;
  
      theme.a11y.removeTrapFocus({
        $container: this.$modal,
        namespace: 'modal_focus'
      });
  
      if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
        this.$activeSource.attr('aria-expanded', 'false').focus();
      }
  
      $('body').trigger('modalClose.' + this.id);
  
      this.unbindEvents();
    };
  
    Modal.prototype.bindEvents = function() {
      // Pressing escape closes modal
      this.nodes.$parent.on('keyup.modal', function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }.bind(this));
  
      if (this.config.closeOffContentClick) {
        // Clicking outside of the modal content also closes it
        this.$modal.on('click.modal', this.close.bind(this));
  
        // Exception to above: clicking anywhere on the modal content will NOT close it
        this.nodes.$modalContent.on('click.modal', function(evt) {
          evt.stopImmediatePropagation();
        });
      }
    };
  
    Modal.prototype.unbindEvents = function() {
      this.nodes.$parent.off('.modal');
  
      if (this.config.closeOffContentClick) {
        this.$modal.off('.modal');
        this.nodes.$modalContent.off('.modal');
      }
    };
  
    return Modal;
  })();
  
  theme.ProductScreen = (function() {
  
    var originalTitle = document.title;
    var namespace = 'productscreen';
    var windowPosition = 0;
    var $page = $('#MainContent');
  
    function ProductScreen(id, name, options) {
      var defaults = {
        close: '.js-screen-close',
        open: '.js-screen-open-' + name,
        openClass: 'screen-layer--is-active',
        closeSlideAnimate: 'screen-layer--is-sliding',
        bodyOpenClass: 'screen-layer-open',
        bodyClosingClass: 'screen-layer-closing',
        bodyCloseAnimate: 'screen-layer-closing screen-layer-animating',
        loaderStart: 200,
        pullToCloseThreshold: -100
      };
  
      this.id = id;
      this.$screen = $('#' + id);
      this.title = this.$screen.data('product-title');
  
      if (!this.$screen.length) {
        return false;
      }
  
      this.nodes = {
        $parent: $('html').add('body'),
        $body: $('body'),
        $loader: $('#OverscrollLoader').find('.icon-loader__path'),
        $screenContent: this.$screen.find('.screen-layer__inner'),
        $photoswipe: $('.pswp')
      };
  
      this.config = $.extend(defaults, options);
      this.initalized = false; // opened at least once
      this.isOpen = false;
      this.$focusOnOpen = this.config.focusOnOpen ? $(this.config.focusOnOpen) : this.$screen;
  
      this.init();
    }
  
    ProductScreen.prototype.init = function() {
      var $openBtn = $(this.config.open);
  
      // Add aria controls
      $openBtn.attr('aria-expanded', 'false');
  
      $('body').on('click', this.config.open, this.open.bind(this));
      this.$screen.find(this.config.close).on('click', { noAnimate: true, back: true }, this.close.bind(this));
  
      // Close screen if product added to sticky cart
      if (theme.settings.cartType === 'sticky') {
        this.nodes.$body.on('added.' + this.id, function() {
          theme.headerNav.toggleThumbMenu(false, true);
          var args = { back: true };
          this.close(false, args);
        }.bind(this));
  
        this.nodes.$body.on('error.' + this.id, function() {
          if (this.initalized) {
            this.open();
          }
        }.bind(this));
      }
    };
  
    ProductScreen.prototype.open = function(evt, data) {
      // Keep track if modal was opened from a click, or called by another function
      var externalCall = false;
      var args = {
        updateCurrentPath: data ? data.updateCurrentPath : true
      };
  
      if (this.isOpen) {
        return;
      }
  
      // Prevent following href if link is clicked
      if (evt) {
        evt.preventDefault();
      } else {
        externalCall = true;
      }
  
      // Without this, the modal opens, the click event bubbles up to $nodes.page
      // which closes the modal.
      if (evt && evt.stopPropagation) {
        evt.stopPropagation();
        // save the source of the click, we'll focus to this on close
        this.$activeSource = $(evt.currentTarget);
      }
  
      if (this.isOpen && !externalCall) {
        this.close();
      }
  
      windowPosition = window.scrollY;
  
      this.$screen
        .prepareTransition()
        .addClass(this.config.openClass);
      this.nodes.$parent.addClass(this.config.bodyOpenClass);
      this.nodes.$screenContent.scrollTop(0);
      window.scrollTo(0,0);
  
      theme.a11y.trapFocus({
        $container: this.$screen,
        $elementToFocus: this.$focusOnOpen,
        namespace: namespace
      });
  
      if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
        this.$activeSource.attr('aria-expanded', 'true');
      }
  
      var newUrl = this.$activeSource.data('url');
      this.nodes.$body
        .trigger('productModalOpen.' + this.id)
        .trigger('newPopstate', {screen: this, url: newUrl, updateCurrentPath: args.updateCurrentPath});
  
      this.initalized = true;
      this.isOpen = true;
      document.title = this.title;
  
      // Trigger Google Analytics page view if enabled
      if (window.ga) { ga('send', 'pageview', { page: newUrl }) }
  
      this.bindEvents();
    };
  
    ProductScreen.prototype.close = function(evt, args) {
      var evtData = args ? args : (evt ? evt.data : null);
      var goBack = evtData ? evtData.back : false;
      var noAnimate = (evtData && evtData.noAnimate) ? true : false;
      this.nodes.$body.removeAttr('style');
      this.nodes.$loader.css('stroke-dashoffset', this.config.loaderStart);
  
      if (goBack) {
        this.nodes.$body.trigger('newPopstate', {screen: this, back: true});
      }
  
      var closeClass = noAnimate ? '' : this.config.closeSlideAnimate;
      var bodyCloseClass = noAnimate ? this.config.bodyClosingClass : this.config.bodyCloseAnimate;
  
      // Don't close if already closed
      if (!this.isOpen) {
        return;
      }
  
      // deselect any focused form elements
      $(document.activeElement).trigger('blur');
  
      this.$screen
        .prepareTransition()
        .removeClass(this.config.openClass)
        .addClass(closeClass);
      this.nodes.$parent
        .removeClass(this.config.bodyOpenClass)
        .addClass(bodyCloseClass);
  
      window.setTimeout(function() {
        this.$screen.removeClass(closeClass);
        this.nodes.$parent.removeClass(bodyCloseClass);
        window.scrollTo(0, windowPosition);
      }.bind(this), 500); // duration of css animation
  
      theme.a11y.removeTrapFocus({
        $container: this.$screen,
        namespace: namespace
      });
  
      if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
        this.$activeSource.attr('aria-expanded', 'false').focus();
      }
  
      this.nodes.$body
        .trigger('productModalClose')
        .trigger('productModalClose.' + this.id);
  
      window.scrollTo(0, windowPosition);
  
      this.isOpen = false;
      document.title = originalTitle;
  
      if (window.ga) { ga('send', 'pageview') }
  
      this.unbindEvents();
    };
  
    ProductScreen.prototype.bindEvents = function() {
      // Pressing escape closes modal, unless the photoswipe screen is open
      this.nodes.$body.on('keyup.' + namespace, function(evt) {
        if (evt.keyCode === 27) {
          if (this.nodes.$photoswipe.hasClass('pswp--open')) {
            return;
          }
          if (this.nodes.$body.hasClass('js-drawer-open')) {
            return;
          }
          var args = { back: true };
          this.close(false, args);
        }
      }.bind(this));
  
      // If scrolling up while at top, close modal
      var bgAmount = 0;
      var loaderAmount = 0;
      $(document).on('touchmove.' + namespace, $.throttle(15, function(evt) {
        var pos = window.scrollY;
  
        if (pos >= 0) {
          return;
        }
  
        bgAmount = -(pos/100);
        this.nodes.$body.css('background', 'rgba(0,0,0,' + bgAmount + ')');
  
        // stroke fills from 200-0 (0 = full)
        loaderAmount = this.config.loaderStart + (pos * 2); // pos is negative number
  
        if (pos <= this.config.pullToCloseThreshold) {
          loaderAmount = 0;
        }
  
        this.nodes.$loader.css('stroke-dashoffset', loaderAmount);
      }.bind(this)));
  
      $(document).on('touchend.' + namespace, function(evt) {
        totalLoader = this.config.loaderStart; // reset to starting point
        var pos = window.scrollY;
        if (pos < this.config.pullToCloseThreshold) {
          var args = { back: true };
          this.close(false, args);
        }
      }.bind(this));
    };
  
    ProductScreen.prototype.unbindEvents = function() {
      this.nodes.$body.off('.' + namespace);
      $(document).off('.' + namespace);
    };
  
    return ProductScreen;
  })();
  
  theme.Drawers = (function() {
    function Drawer(id, name) {
      this.config = {
        id: id,
        close: '.js-drawer-close',
        open: '.js-drawer-open-' + name,
        openClass: 'js-drawer-open',
        closingClass: 'js-drawer-closing',
        activeDrawer: 'drawer--is-open',
        namespace: '.drawer-' + name
      };
  
      this.$nodes = {
        parent: $(document.documentElement).add('body'),
        page: $('body')
      };
  
      this.$drawer = $('#' + id);
  
      if (!this.$drawer.length) {
        return false;
      }
  
      this.isOpen = false;
      this.init();
    };
  
    Drawer.prototype = $.extend({}, Drawer.prototype, {
      init: function() {
        var $openBtn = $(this.config.open);
  
        // Add aria controls
        $openBtn.attr('aria-expanded', 'false');
  
        $openBtn.on('click', this.open.bind(this));
        this.$drawer.find(this.config.close).on('click', this.close.bind(this));
      },
  
      open: function(evt, returnFocusEl) {
        if (evt) {
          evt.preventDefault();
        }
  
        if (this.isOpen) {
          return;
        }
  
        // Without this the drawer opens, the click event bubbles up to $nodes.page which closes the drawer.
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
          // save the source of the click, we'll focus to this on close
          this.$activeSource = $(evt.currentTarget).attr('aria-expanded', 'true');
        } else if (returnFocusEl) {
          var $el = $(returnFocusEl);
          this.$activeSource = $el.attr('aria-expanded', 'true');
        }
  
        this.$drawer.prepareTransition().addClass(this.config.activeDrawer);
  
        this.$nodes.parent.addClass(this.config.openClass);
        this.isOpen = true;
  
        theme.a11y.trapFocus({
          $container: this.$drawer,
          namespace: 'drawer_focus'
        });
  
        $('body').trigger('drawerOpen.' + this.config.id);
  
        this.bindEvents();
      },
  
      close: function() {
        if (!this.isOpen) {
          return;
        }
  
        // deselect any focused form elements
        $(document.activeElement).trigger('blur');
  
        this.$drawer.prepareTransition().removeClass(this.config.activeDrawer);
  
        this.$nodes.parent.removeClass(this.config.openClass);
        this.$nodes.parent.addClass(this.config.closingClass);
        window.setTimeout(function() {
          this.$nodes.parent.removeClass(this.config.closingClass);
          if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
            this.$activeSource.attr('aria-expanded', 'false').focus();
          }
        }.bind(this), 500);
  
        this.isOpen = false;
  
        theme.a11y.removeTrapFocus({
          $container: this.$drawer,
          namespace: 'drawer_focus'
        });
  
        this.unbindEvents();
      },
  
      bindEvents: function() {
        theme.a11y.lockMobileScrolling(this.config.namespace, this.$nodes.page);
  
        // Clicking body closes drawer
        this.$nodes.page.on('click' + this.config.namespace, function (evt) {
          if (evt.target === this.$nodes.page[0]) {
            this.close();
            return false;
          }
        }.bind(this));
  
        // Pressing escape closes drawer
        this.$nodes.parent.on('keyup' + this.config.namespace, function(evt) {
          if (evt.keyCode === 27) {
            this.close();
          }
        }.bind(this));
      },
  
      unbindEvents: function() {
        theme.a11y.unlockMobileScrolling(this.config.namespace, this.$nodes.page);
        this.$nodes.parent.off(this.config.namespace);
        this.$nodes.page.off(this.config.namespace);
      }
    });
  
    return Drawer;
  })();
  
  theme.cart = {
    getCart: function() {
      return $.getJSON(theme.routes.cart);
    },
  
    changeItem: function(key, qty) {
      return this._updateCart({
        type: 'POST',
        url: theme.routes.cartChange,
        data: 'quantity=' + qty + '&id=' + key,
        dataType: 'json'
      });
    },
  
    addItemFromForm: function(data) {
      return this._updateCart({
        type: 'POST',
        url: theme.routes.cartAdd,
        data: data,
        dataType: 'json'
      });
    },
  
    _updateCart: function(params) {
      return $.ajax(params)
        .then(function(cart) {
          $('body').trigger('updateCart', cart);
          return cart;
        }.bind(this))
    },
  
    updateNote: function(note) {
      var params = {
        type: 'POST',
        url: '/cart/update.js',
        data: 'note=' + theme.cart.attributeToString(note),
        dataType: 'json',
        success: function(cart) {},
        error: function(XMLHttpRequest, textStatus) {}
      };
  
      $.ajax(params);
    },
  
    attributeToString: function(attribute) {
      if ((typeof attribute) !== 'string') {
        attribute += '';
        if (attribute === 'undefined') {
          attribute = '';
        }
      }
      return attribute.trim();
    }
  }
  
  $(function() {
    // Add a loading indicator on the cart checkout button (/cart and drawer)
    $('body').on('click', '.cart__checkout', function() {
      $(this).addClass('btn--loading');
    });
  
    $('body').on('change', 'textarea[name="note"]', function() {
      var newNote = $(this).val();
      theme.cart.updateNote(newNote);
    });
  
  
    // Custom JS to prevent checkout without confirming terms and conditions
    $('body').on('click', '.cart__checkout--ajax', function(evt) {
      if ($('#CartAgree').is(':checked')) {
      } else {
        alert(theme.strings.cartTermsConfirmation);
        $(this).removeClass('btn--loading');
        return false;
      }
    });
  
    $('body').on('click', '.cart__checkout--page', function(evt) {
      if ($('#CartPageAgree').is(':checked')) {
      } else {
        alert(theme.strings.cartTermsConfirmation);
        $(this).removeClass('btn--loading');
        return false;
      }
    });
  });
  
  theme.AjaxCart = (function() {
    var config = {
      namespace: '.ajaxcart'
    };
  
    var data = {
      itemId: 'data-cart-item-id'
    };
  
    var selectors = {
      form: 'form.cart',
      cartCount: '.cart-link__count',
      updateBtn: '.update-cart',
  
      itemList: '[data-cart-item-list]',
      item: '[data-cart-item]',
      itemId: '[data-cart-item-id]',
      itemHref: '[data-cart-item-href]',
      itemBackgroundImage: '[data-cart-item-background-image]',
      itemTitle: '[data-cart-item-title]',
      itemVariantTitle: '[data-cart-item-variant-title]',
      itemPropertyList: '[data-cart-item-property-list]',
      itemProperty: '[data-cart-item-property]',
      itemDiscountList: '[data-cart-item-discount-list]',
      itemDiscount: '[data-cart-item-discount]',
      itemDiscountTitle: '[data-cart-item-discount-title]',
      itemDiscountAmount: '[data-cart-item-discount-amount]',
      itemLabelQuantity: '[data-cart-item-label-quantity]',
      itemInputQuantity: '[data-cart-item-input-quantity]',
      itemDelete: '[data-cart-item-delete]',
      itemPriceContainer: '[data-cart-item-price-container]',
      itemLinePriceContainer: '[data-cart-item-line-price-container]',
      itemUnitPrice: '[data-cart-item-unit-price]',
      itemMessage: '[data-item-message]',
      itemSubscriptionName: '[data-cart-item-subscription-name]',
      cartDiscountContainer: '[data-cart-discount-container]',
      cartDiscountContent: '[data-cart-discount-content]',
      cartDiscount: '[data-cart-discount]',
      cartDiscountTitle: '[data-cart-discount-title]',
      cartDiscountAmount: '[data-cart-discount-amount]',
      cartNoteContainer: '[data-cart-note-container]',
      cartNoteInput: '[data-cart-note]',
      cartMessage: '[data-cart-message]',
      cartSubtotal: '[data-cart-subtotal]',
      cartSubmit: '[data-cart-submit]'
    };
  
    var classes = {
      cartHasItems: 'cart-has-items',
      cartTemplate: 'ajax-cart__template',
      cartItemRemove: 'cart__item--remove',
      staticDrawerElement: 'drawer--cart--static'
    };
  
    function AjaxCart(id) {
      this.id = id;
      var $container = this.$container = $('#' + id);
  
      this.status = {
        loaded: false,
        loading: false,
        isDrawer: $container.attr('data-drawer')
      };
  
      if (this.status.isDrawer) {
        this.drawer = new theme.Drawers(id, 'cart');
      }
  
      this.init();
      this.initEventListeners();
    };
  
    AjaxCart.prototype = $.extend({}, AjaxCart.prototype, {
      init: function() {
        this.$form = $(selectors.form, this.$container);
        $(selectors.updateBtn, this.$form).addClass('hide');
        this.$itemTemplate = $(selectors.item, this.$form).first().clone();
        this.$propertyTemplate = $(selectors.itemProperty, this.$form).first().clone();
        this.$discountTemplate = $(selectors.itemDiscount, this.$form).first().clone();
        this.$cartDiscountTemplate = $(selectors.cartDiscount, this.$container).first().clone();
      },
  
      initEventListeners: function() {
        $('body').on('updateCart', function(evt, cart) {
          theme.cart.getCart().then(function(cart) {
            this.buildCart(cart);
            this.updateCartNotification(cart);
  
            // Open cart once updated
            var openDrawer = false;
            if (this.status.isDrawer) {
              this.drawer.open();
              openDrawer = true;
            }
          }.bind(this));
        }.bind(this));
  
        this.$container.on('click', selectors.itemDelete, this._onItemDelete.bind(this));
        this.$container.on('input', selectors.itemInputQuantity, $.debounce(500, this._onItemQuantityChange.bind(this)));
        this.$container.on('blur', selectors.itemInputQuantity, this._onItemQuantityEmptyBlur.bind(this));
        this.$container.on('focus', selectors.itemInputQuantity, this._highlightText);
      },
  
      buildCart: function(cart, openDrawer) {
        this.loading(true);
  
        this.$form.removeClass('cart--empty');
  
        if (cart.item_count === 0) {
          this.$form.addClass('cart--empty');
          this.status.loaded = true;
          this.loading(false);
          return;
        }
  
        // If 3+ items, remove static class for a 100% height cart drawer
        if (cart.items.length > 2) {
          this.$container.removeClass(classes.staticDrawerElement);
        } else {
          this.$container.addClass(classes.staticDrawerElement);
        }
  
        var $cart = this._createCart(cart);
        morphdom(this.$form[0], $cart[0]);
  
        if (Shopify && Shopify.StorefrontExpressButtons) {
          Shopify.StorefrontExpressButtons.initialize();
        }
  
        // If specifically asked, open the cart drawer (only happens after product added from form)
        if (this.status.isDrawer) {
          if (openDrawer === true) {
            this.drawer.open();
          }
        }
  
        this.status.loaded = true;
        this.loading(false);
  
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: {
            cart: cart
          }
        }));
      },
  
      _createCart: function(cart) {
        var $form = this.$form.clone();
  
        $(selectors.item, $form)
          .not(selectors.cartNoteContainer)
          .remove();
  
        $(selectors.itemList, $form)
          .prepend(this._createItemList(cart));
  
        $(selectors.cartNoteInput, $form)
          .val(cart.note);
  
        $(selectors.cartDiscountContainer, $form)
          .toggleClass('hide', cart.cart_level_discount_applications.length === 0);
  
        $(selectors.cartDiscountContent, $form).html(
          this._createCartDiscountList(cart));
  
        $(selectors.cartSubtotal, $form)
          .html(theme.Currency.formatMoney(cart.total_price, theme.settings.moneyFormat));
  
        $(selectors.cartSubmit, $form).attr('disabled', cart.items.length === 0);
  
        return $form;
      },
  
      _createItemList: function(cart) {
        return $.map(cart.items, function(item) {
          var $item = this.$itemTemplate.clone().removeClass(classes.cartTemplate);
          var propertyList = this._createPropertyList(item);
          var discountList = this._createDiscountList(item);
          var unitPrice = this._createUnitPrice(item);
  
          var itemPrice = this._createItemPrice(
            item.original_price,
            item.final_price
          );
  
          var itemLinePrice = this._createItemPrice(
            item.original_line_price,
            item.final_line_price
          );
  
          $item.find(selectors.itemId)
            .addBack(selectors.itemId)
            .attr(data.itemId, item.key);
  
          $(selectors.itemHref, $item)
            .attr('href', item.url);
  
          $(selectors.itemBackgroundImage, $item)
            .removeAttr('data-bgset')
            .css('background-image', item.image ? 'url(' + theme.Images.getSizedImageUrl(item.image, '200x') + ')' : 'none')
            .addClass('lazyload');
  
          $(selectors.itemTitle, $item).text(item.product_title);
  
          $(selectors.itemVariantTitle, $item).text(item.variant_title);
  
          $(selectors.itemPriceContainer, $item).html(itemPrice);
  
          $(selectors.itemLinePriceContainer, $item).html(itemLinePrice);
  
          $(selectors.itemLinePrice, $item)
            .html(theme.Currency.formatMoney(item.line_price, theme.settings.moneyFormat));
  
          $(selectors.itemLabelQuantity, $item)
            .attr('for', 'quantity_' + item.key);
  
          $(selectors.itemInputQuantity, $item)
            .attr('data-id', item.key)
            .attr('id', 'quantity_' + item.key)
            .val(item.quantity);
  
          var sellingPlanName = item.selling_plan_allocation
              ? item.selling_plan_allocation.selling_plan.name
              : null;
          $(selectors.itemSubscriptionName, $item)
            .text(sellingPlanName);
  
          $(selectors.itemPropertyList, $item)
            .html(propertyList);
  
          $(selectors.itemDiscountList, $item)
            .html(discountList);
  
          $(selectors.itemUnitPrice, $item)
            .html(unitPrice);
  
          return $item[0];
        }.bind(this));
      },
  
      _createItemPrice: function(original_price, final_price) {
        if (original_price !== final_price) {
          return (
            '<span class="visually-hidden">' + theme.strings.regularPrice + '</span>' +
            '<del class="cart__item-price--original">' +
            theme.Currency.formatMoney(original_price, theme.settings.moneyFormat) +
            '</del>' +
            '<span class="visually-hidden">' + theme.strings.salePrice + '</span>' +
            '<span class="cart__item-price cart__item-price--bold">' +
            theme.Currency.formatMoney(final_price, theme.settings.moneyFormat) +
            '</span>'
          );
        } else {
          return (
            '<span class="cart__item-price">' + theme.Currency.formatMoney(original_price, theme.settings.moneyFormat) + '</span>'
          );
        }
      },
  
      _createPropertyList: function(item) {
        return $.map(item.properties, function(value, key) {
          var $property = this.$propertyTemplate.clone().removeClass(classes.cartTemplate);
  
          // Line item properties prefixed with an underscore are not to be displayed
          if (key.charAt(0) === '_') return;
  
          // Line item properties with no value are not to be displayed
          if (value === '') return;
  
          if (value.indexOf('/uploads/') === -1) {
            $property
              .text(key + ': ' + value);
          } else {
            $property
              .html(key + ': <a href="' + value + '">' + value.split('/').pop() + '</a>');
          }
  
          return $property[0];
        }.bind(this));
      },
  
      _createDiscountList: function(item) {
        return $.map(item.line_level_discount_allocations, function(discount) {
          var $discount = this.$discountTemplate.clone().removeClass(classes.cartTemplate);
  
          $discount
            .find(selectors.itemDiscountTitle)
            .text(discount.discount_application.title);
          $discount
            .find(selectors.itemDiscountAmount)
            .html(theme.Currency.formatMoney(discount.amount, theme.settings.moneyFormat));
  
          return $discount[0];
        }.bind(this));
      },
  
      _createCartDiscountList: function(cart) {
        return $.map(
          cart.cart_level_discount_applications,
          function(discount) {
            var $discount = this.$cartDiscountTemplate.clone().removeClass(classes.cartTemplate);
  
            $discount.find(selectors.cartDiscountTitle)
              .text(discount.title);
            $discount
              .find(selectors.cartDiscountAmount)
              .html(theme.Currency.formatMoney(discount.total_allocated_amount, theme.settings.moneyFormat));
  
            return $discount[0];
          }.bind(this)
        );
      },
  
      _createUnitPrice: function(item) {
        var price = theme.Currency.formatMoney(item.unit_price, theme.settings.moneyFormat);
        var base = theme.Currency.getBaseUnit(item);
  
        return price + '/' + base;
      },
  
      _onItemQuantityChange: function(evt) {
        this.loading(true);
  
        var $input = $(evt.target);
        var id = $input.closest(selectors.item).attr(data.itemId);
        var quantity = $input.val();
  
        // Don't update the cart when a input is empty. Also make sure an input
        // does not remain empty by checking blur event
        if (quantity === '') { return; }
  
        if (quantity == 0) {
          var response = confirm(theme.strings.cartConfirmDelete);
          if (response === false) {
            $input.val(1);
            this.loading(false);
            return;
          }
        }
  
        theme.cart.changeItem(id, quantity);
      },
  
      _onItemQuantityEmptyBlur: function(evt) {
        var $input = $(evt.target);
        var id = $input.closest(selectors.item).attr(data.itemId);
        var value = $input.val();
  
        if (value !== '') { return; }
  
        theme.cart.getCart().then(function(cart) {
          this.buildCart(cart);
        }.bind(this));
      },
  
      _onItemDelete: function(evt) {
        evt.preventDefault();
  
        var $deleteButton = $(evt.target);
        var $items = $(selectors.item, this.$container);
        var $item = $deleteButton.closest(selectors.item);
        var $note = $(selectors.cartNoteContainer, this.$container);
        var id = $item.attr(data.itemId);
  
        if ($items.length === 2 && $items.last().is($note)) {
          $note.addClass(classes.cartItemRemove);
  
          theme.a11y.promiseTransitionEnd($(selectors.itemList, this.$container)).then(function() {
            $note.removeClass(classes.cartItemRemove);
          });
        }
  
        $item.addClass(classes.cartItemRemove);
  
        theme.a11y.promiseAnimationEnd($item).then(function() {
          theme.cart.changeItem(id, 0);
        }.bind(this));
      },
  
      loading: function(state) {
        this.status.loading = state;
  
        if (state) {
          $(selectors.itemList, this.$form).addClass('loading');
        } else {
          $(selectors.itemList, this.$form).removeClass('loading');
        }
      },
  
      updateCartNotification: function(cart) {
        $(selectors.cartCount).text(cart.item_count);
        $('body').toggleClass(classes.cartHasItems, cart.item_count > 0);
      },
  
      _highlightText: function(evt) {
        // Don't want the mobile tooltip to pop up
        if (!theme.config.isTouch) {
          $(evt.target).select();
        }
      }
    });
  
    return AjaxCart;
  })();
  
  theme.StickyCart = (function() {
    var config = {
      namespace: '.ajaxcart'
    };
  
    var selectors = {
      cart: '#StickyCart',
      items: '#StickyItems',
      subtotal: '#StickySubtotal',
      submit: '#StickySubmit'
    };
  
    var classes = {
      cartTemplate: 'template-cart',
      active: 'sticky-cart--open',
      activeBodyClass: 'body--sticky-cart-open'
    };
  
    function StickyCart() {
      this.status = {
        loaded: false,
        loading: false,
        open: $('body').hasClass(classes.activeBodyClass)
      };
  
      this.initEventListeners();
    };
  
    function refresh(cart) {
      if ($('body').hasClass(classes.cartTemplate)) {
        return;
      }
  
      if (cart.item_count > 0) {
        $('body').addClass(classes.activeBodyClass);
        $(selectors.cart).addClass(classes.active);
      } else {
        $('body').removeClass(classes.activeBodyClass);
        $(selectors.cart).removeClass(classes.active);
      }
  
      $(selectors.items).text(theme.strings.cartItems.replace('[count]', cart.item_count));
      $(selectors.subtotal).html(theme.Currency.formatMoney(cart.total_price, theme.settings.moneyFormat));
    };
  
    StickyCart.prototype = $.extend({}, StickyCart.prototype, {
      initEventListeners: function() {
        $(selectors.submit).on('click', function() {
          $(this).addClass('btn--loading');
        });
  
        $('body').on('added.ajaxProduct', function() {
          this.hideCart();
          theme.cart.getCart().then(function(cart) {
            this.buildCart(cart, true);
          }.bind(this));
        }.bind(this));
      },
  
      hideCart: function() {
        $('body').removeClass(classes.activeBodyClass);
        $(selectors.cart).removeClass(classes.active);
      },
  
      showCart: function(count, subtotal) {
        if (count) {
          $(selectors.items).text(theme.strings.cartItems.replace('[count]', count));
        }
        if (subtotal) {
          $(selectors.subtotal).html(theme.Currency.formatMoney(subtotal, theme.settings.moneyFormat));
        }
  
        $('body').addClass(classes.activeBodyClass);
        $(selectors.cart).addClass(classes.active);
  
        this.status.open = true;
      },
  
      buildCart: function(cart, open) {
        this.loading(true);
  
        this.status.loaded = true;
        this.loading(false);
  
        // If specifically asked, open the cart (only happens after product added from form)
        if (open === true) {
          this.showCart(cart.item_count, cart.total_price);
        }
      },
  
      loading: function(state) {
        this.status.loading = state;
  
        if (state) {
          $(selectors.cart).addClass('is-loading');
        } else {
          $(selectors.cart).removeClass('is-loading');
        }
      },
  
      updateError: function(XMLHttpRequest) {
        if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
          console.warn(XMLHttpRequest.responseJSON.description);
        }
      }
    });
  
    return {
      init: StickyCart,
      refresh: refresh
    }
  })();
  
  theme.AjaxProduct = (function() {
    var status = {
      loading: false
    };
  
    function ProductForm($form) {
      this.$form = $form;
      this.$addToCart = this.$form.find('.add-to-cart');
      this.productId = $form.find('[name="data-product-id"]').val();
  
      if (this.$form.length) {
        this.$form.on('submit', this.addItemFromForm.bind(this));
      }
    };
  
    ProductForm.prototype = $.extend({}, ProductForm.prototype, {
      addItemFromForm: function(evt, callback){
        evt.preventDefault();
  
        if (status.loading) {
          return;
        }
  
        this.$form.find('[data-add-to-cart]').addClass('btn--loading');
  
        status.loading = true;
  
        var data = this.$form.serialize();
  
        $('body').trigger('added.ProductScreen-' + this.productId);
  
        theme.cart.addItemFromForm(data)
          .then(function(product) {
            this.success(product);
          }.bind(this))
          .catch(function(XMLHttpRequest) {
            this.error(XMLHttpRequest)
          }.bind(this))
          .always(function() {
            status.loading = false;
            this.$form.find('[data-add-to-cart]').removeClass('btn--loading');
          }.bind(this));
      },
  
      success: function(product) {
        this.$form.find('.errors').remove();
        $('body').trigger('added.ajaxProduct');
        document.dispatchEvent(new CustomEvent('added:ajaxProduct', {
          detail: {
            product: product
          }
        }));
      },
  
      error: function(XMLHttpRequest) {
        this.$form.find('.errors').remove();
  
        if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.description) {
          console.warn(XMLHttpRequest.responseJSON.description);
  
          $('body').trigger('error.ProductScreen-' + this.productId);
  
          document.dispatchEvent(new CustomEvent('error:ajaxProduct', {
            detail: {
              errorMessage: XMLHttpRequest.responseJSON.description
            }
          }));
  
          this.$form.prepend('<div class="errors text-center">' + XMLHttpRequest.responseJSON.description + '</div>');
        }
      }
    });
  
    return ProductForm;
  })();
  
  // Either collapsible containers all acting individually,
  // or tabs that can only have one open at a time
  theme.collapsibles = (function() {
  
    var selectors = {
      trigger: '.collapsible-trigger',
      module: '.collapsible-content',
      moduleInner: '.collapsible-content__inner',
      tabs: '.collapsible-trigger--tab'
    };
  
    var classes = {
      hide: 'hide',
      open: 'is-open',
      autoHeight: 'collapsible--auto-height',
      tabs: 'collapsible-trigger--tab'
    };
  
    var namespace = '.collapsible';
  
    var isTransitioning = false;
  
    function init() {
      $(selectors.trigger).each(function() {
        var $el = $(this);
        var state = $el.hasClass(classes.open);
        $el.attr('aria-expanded', state);
      });
  
      $('body')
        .off(namespace)
        .on('click' + namespace, selectors.trigger, function() {
        if (isTransitioning) {
          return;
        }
  
        isTransitioning = true;
  
        var $el = $(this);
        var isOpen = $el.hasClass(classes.open);
        var isTab = $el.hasClass(classes.tabs);
        var moduleId = $el.attr('aria-controls');
        var $module = $('#' + moduleId);
        var height = $module.find(selectors.moduleInner).outerHeight();
        var isAutoHeight = $el.hasClass(classes.autoHeight);
  
        if (isTab) {
          if (isOpen) {
            isTransitioning = false;
            return;
          }
  
          var $newModule;
          // If tab, close all other tabs with same ID before opening
          $(selectors.tabs + '[data-id=' + $el.data('id') + ']').each(function() {
            $(this).removeClass(classes.open);
            $newModule = $('#' + $(this).attr('aria-controls'));
            setTransitionHeight($newModule, 0, true);
          });
        }
  
        // If isAutoHeight, set the height to 0 just after setting the actual height
        // so the closing animation works nicely
        if (isOpen && isAutoHeight) {
          setTimeout(function() {
            height = 0;
            setTransitionHeight($module, height, isOpen, isAutoHeight);
          }, 0);
        }
  
        if (isOpen && !isAutoHeight) {
          height = 0;
        }
  
        $el
          .attr('aria-expanded', !isOpen)
          .toggleClass(classes.open, !isOpen);
  
        setTransitionHeight($module, height, isOpen, isAutoHeight);
      });
    }
  
    function setTransitionHeight($module, height, isOpen, isAutoHeight) {
      $module
        .removeClass(classes.hide)
        .prepareTransition()
        .css('height', height)
        .toggleClass(classes.open, !isOpen);
  
      if (!isOpen && isAutoHeight) {
        var o = $module;
        window.setTimeout(function() {
          o.css('height','auto');
          isTransitioning = false;
        }, 0);
      } else {
        isTransitioning = false;
      }
    }
  
    return {
      init: init
    };
  })();
  
  theme.headerNav = (function() {
  
    var selectors = {
      wrapper: '.header-wrapper',
      siteHeader: '.site-header',
      logoContainer: '.site-header__logo',
      logo: '.site-header__logo img',
      navigation: '.site-navigation',
      navContainerWithLogo: '.header-item--logo',
      navItems: '.site-nav__item',
      navLinks: '.site-nav__link',
      navLinksWithDropdown: '.site-nav__link--has-dropdown',
      navDropdownLinks: '.site-nav__dropdown-link--second-level',
      thumbMenu: '.site-nav__thumb-menu'
    };
  
    var classes = {
      hasDropdownClass: 'site-nav--has-dropdown',
      hasSubDropdownClass: 'site-nav__deep-dropdown-trigger',
      dropdownActive: 'is-focused',
      stickyCartActive: 'body--sticky-cart-open',
      overlayEnabledClass: 'header-wrapper--overlay',
      overlayedClass: 'is-light',
      thumbMenuInactive: 'site-nav__thumb-menu--inactive',
      stickyClass: 'site-header--sticky',
      overlayStickyClass: 'header-wrapper--sticky',
      openTransitionClass: 'site-header--opening'
    };
  
    var config = {
      namespace: '.siteNav',
      overlayHeader: false,
      stickyActive: false,
      forceStickyOnMobile: false,
      forceCloseThumbNav: false
    };
  
    // Elements used in resize functions, defined in init
    var $window;
    var $navContainerWithLogo;
    var $logoContainer;
    var $nav;
    var $wrapper;
    var $siteHeader;
  
    function init() {
      $window = $(window);
      $navContainerWithLogo = $(selectors.navContainerWithLogo);
      $logoContainer = $(selectors.logoContainer);
      $nav = $(selectors.navigation);
      $wrapper = $(selectors.wrapper);
      $siteHeader = $(selectors.siteHeader);
  
      // Reset config
      config.overlayHeader = theme.settings.overlayHeader = $siteHeader.data('overlay');
      config.stickyActive = false;
  
      accessibleDropdowns();
      var searchModal = new theme.Modals('SearchModal', 'search-modal', {
        closeOffContentClick: false,
        focusOnOpen: '#SearchModalInput'
      });
  
      // One listener for all header-related resize and load functions
      $window
        .on('resize' + config.namespace, $.debounce(150, headerResize))
        .on('load' + config.namespace, headerLoad);
  
      // Determine type of header:
        // desktop: sticky bar | sticky button | top only
        // mobile: always sticky button
      setHeaderStyle();
  
      // Sticky menu (bar or thumb) on scroll
      $window.on('scroll' + config.namespace, $.throttle(150, stickyMenuOnScroll));
  
      // Make sure sticky nav appears after header is reloaded in editor
      if (Shopify.designMode) {
        $window.trigger('resize');
      }
    }
  
    function headerLoad() {
      resizeLogo();
      initStickyThumbMenu();
  
      if (config.headerStyle === 'bar') {
        initStickyBarMenu();
      }
    }
  
    function headerResize() {
      resizeLogo();
      setHeaderStyle();
  
      if (config.headerStyle === 'bar') {
        stickyHeaderHeight();
      }
    }
  
    function setHeaderStyle() {
      if (theme.config.bpSmall) {
        config.headerStyle = 'button';
      } else {
        config.headerStyle = $wrapper.data('header-style');
      }
  
      config.stickyThreshold = config.headerStyle === 'button' ? 100 : 250;
  
      if (config.headerStyle !== 'button') {
        toggleThumbMenu(false);
      }
    }
  
    function unload() {
      $(window).off(config.namespace);
      $(selectors.navLinks).off(config.namespace);
      $(selectors.navDropdownLinks).off(config.namespace);
    }
  
    function resizeLogo() {
      // Using .each() because of possible reversed color logo
      $(selectors.logo).each(function() {
        var $el = $(this),
            logoWidthOnScreen = $el.width(),
            containerWidth = $el.closest('.grid__item').width();
        // If image exceeds container, let's make it smaller
        if (logoWidthOnScreen > containerWidth) {
          $el.css('maxWidth', containerWidth);
        }
        else {
          $el.removeAttr('style');
        }
      });
    }
  
    function accessibleDropdowns() {
      var hasActiveDropdown = false;
      var hasActiveSubDropdown = false;
      var closeOnClickActive = false;
  
      // Touch devices open dropdown on first click, navigate to link on second
      if (theme.config.isTouch) {
        $(selectors.navLinksWithDropdown).on('touchend' + config.namespace, function(evt) {
          var $el = $(this);
          var $parentItem = $el.parent();
          if (!$parentItem.hasClass(classes.dropdownActive)) {
            evt.preventDefault();
            closeDropdowns();
            openFirstLevelDropdown($el);
          } else {
            window.location.replace($el.attr('href'));
          }
        });
  
        $(selectors.navDropdownLinks).on('touchend' + config.namespace, function(evt) {
          var $el = $(this);
          var $parentItem = $el.parent();
  
          // Open third level menu or go to link based on active state
          if ($parentItem.hasClass(classes.hasSubDropdownClass)) {
            if (!$parentItem.hasClass(classes.dropdownActive)) {
              evt.preventDefault();
              closeThirdLevelDropdown();
              openSecondLevelDropdown($el);
            } else {
              window.location.replace($el.attr('href'));
            }
          } else {
            // No third level nav, go to link
            window.location.replace($el.attr('href'));
          }
        });
      }
  
      // Open/hide top level dropdowns
      $(selectors.navLinks).on('focusin mouseover' + config.namespace, function() {
        if (hasActiveDropdown) {
          closeSecondLevelDropdown();
        }
  
        if (hasActiveSubDropdown) {
          closeThirdLevelDropdown();
        }
  
        openFirstLevelDropdown($(this));
      });
  
      // Force remove focus on sitenav links because focus sometimes gets stuck
      $(selectors.navLinks).on('mouseleave' + config.namespace, function() {
        closeDropdowns();
      });
  
      // Open/hide sub level dropdowns
      $(selectors.navDropdownLinks).on('focusin' + config.namespace, function() {
        closeThirdLevelDropdown();
        openSecondLevelDropdown($(this), true);
      });
  
      // Private dropdown methods
      function openFirstLevelDropdown($el) {
        var $parentItem = $el.parent();
        if ($parentItem.hasClass(classes.hasDropdownClass)) {
          $parentItem.addClass(classes.dropdownActive);
          hasActiveDropdown = true;
        }
  
        if (!theme.config.isTouch) {
          if (!closeOnClickActive) {
            var eventType = theme.config.isTouch ? 'touchend' : 'click';
            closeOnClickActive = true;
            $('body').on(eventType + config.namespace, function() {
              closeDropdowns();
              $('body').off(config.namespace);
              closeOnClickActive = false;
            });
          }
        }
      }
  
      function openSecondLevelDropdown($el, skipCheck) {
        var $parentItem = $el.parent();
        if ($parentItem.hasClass(classes.hasSubDropdownClass) || skipCheck) {
          $parentItem.addClass(classes.dropdownActive);
          hasActiveSubDropdown = true;
        }
      }
  
      function closeDropdowns() {
        closeSecondLevelDropdown();
        closeThirdLevelDropdown();
      }
  
      function closeSecondLevelDropdown() {
        $(selectors.navItems).removeClass(classes.dropdownActive);
      }
  
      function closeThirdLevelDropdown() {
        $(selectors.navDropdownLinks).parent().removeClass(classes.dropdownActive);
      }
    }
  
    function initStickyBarMenu() {
      $siteHeader.wrap('<div class="site-header-sticky"></div>');
  
      // No need to set a height on wrapper if positioned absolutely already
      if (config.overlayHeader) {
        return;
      }
  
      stickyHeaderHeight();
      setTimeout(function() {
        stickyHeaderHeight();
  
        // Don't let height get stuck on 0
        if ($('.site-header-sticky').outerHeight() === 0) {
          setTimeout(function() {
            $window.trigger('resize');
          }, 500);
        }
      }, 200);
    }
  
    function stickyHeaderHeight() {
      $('.site-header-sticky').css('height', $siteHeader.outerHeight(true));
    }
  
    function initStickyThumbMenu() {
      if ($('body').hasClass(classes.stickyCartActive)) {
        return;
      }
  
      if (theme.config.bpSmall && theme.template !== 'product') {
        setTimeout(function() {
          config.forceStickyOnMobile = true;
          toggleThumbMenu(true);
        }, 25);
      }
    }
  
    function stickyMenuOnScroll(evt) {
      var scroll = $window.scrollTop();
  
      if (scroll > config.stickyThreshold) {
        if (config.forceStickyOnMobile) {
          config.forceStickyOnMobile = false;
        }
  
        if (config.stickyActive) {
          return;
        }
  
        if (config.headerStyle === 'button') {
          toggleThumbMenu(true);
        } else if (config.headerStyle === 'bar') {
          toggleBarMenu(true);
        }
      } else {
        // If menu is shown on mobile page load, do not
        // automatically hide it when you start scrolling
        if (config.forceStickyOnMobile) {
          return;
        }
  
        if (!config.stickyActive) {
          return;
        }
  
        if (config.headerStyle === 'button') {
          if (!theme.config.bpSmall) {
            toggleThumbMenu(false);
          }
        } else if (config.headerStyle === 'bar') {
          toggleBarMenu(false);
        }
  
        if (!config.overlayHeader) {
          stickyHeaderHeight();
        }
      }
    }
  
    function toggleThumbMenu(active, forceClose) {
      // If forced close, will not open again until page refreshes
      // because sticky nav is open
      if (config.forceCloseThumbNav) {
        return;
      }
  
      // If thumb menu is open, do not hide menu button
      if ($('.slide-nav__overflow--thumb').hasClass('js-menu--is-open')) {
        return;
      }
  
      $(selectors.thumbMenu).toggleClass(classes.thumbMenuInactive, !active);
      config.stickyActive = active;
  
      config.forceCloseThumbNav = forceClose;
    }
  
    function toggleBarMenu(active) {
      if (config.headerStyle !== 'bar') {
        return;
      }
  
      if (active) {
        $siteHeader.addClass(classes.stickyClass);
        if (config.overlayHeader) {
          $wrapper
            .removeClass(classes.overlayedClass)
            .addClass(classes.overlayStickyClass);
        }
  
        // Add open transition class after element is set to fixed
        // so CSS animation is applied correctly
        setTimeout(function() {
          $siteHeader.addClass(classes.openTransitionClass);
        }, 100);
      } else {
        $siteHeader.removeClass(classes.openTransitionClass).removeClass(classes.stickyClass);
  
        if (config.overlayHeader) {
          $wrapper
            .addClass(classes.overlayedClass)
            .removeClass(classes.overlayStickyClass);
        }
      }
  
      config.stickyActive = active;
    }
  
    // If the header setting to overlay the menu on the collection image
    // is enabled but the collection setting is disabled, we need to undo
    // the init of the sticky nav
    function disableOverlayHeader() {
      $(selectors.wrapper)
        .removeClass(classes.overlayEnabledClass)
        .removeClass(classes.overlayedClass);
  
      config.overlayHeader = theme.settings.overlayHeader = false;
    }
  
    return {
      init: init,
      disableOverlayHeader: disableOverlayHeader,
      toggleThumbMenu: toggleThumbMenu,
      unload: unload
    };
  })();
  
  theme.slideNav = (function() {
  
    var selectors = {
      container: '#PageContainer',
      navWrapper: '.slide-nav__overflow',
      nav: '#SlideNav',
      toggleBtn: '.js-toggle-slide-nav',
      subNavToggleBtn: '.js-toggle-submenu',
      thumbNavToggle: '.site-nav__thumb-button'
    };
  
    var classes = {
      subNavLink: 'slide-nav__sublist-link',
      return: 'slide-nav__return-btn',
      isActive: 'is-active',
      isOpen: 'js-menu--is-open',
      subNavShowing: 'sub-nav--is-open',
      thirdNavShowing: 'third-nav--is-open'
    };
  
    var namespace = '.slideNav';
  
    var isTransitioning;
    var $activeSubNav;
    var $activeTrigger;
    var pageSlide = true;
    var menuLevel = 1;
  
    function init() {
      if ($(selectors.thumbNavToggle).length) {
        pageSlide = false;
      }
  
      $(selectors.toggleBtn).on('click' + namespace, toggleNav);
      $(selectors.subNavToggleBtn).on('click' + namespace, toggleSubNav);
    }
  
    function toggleNav() {
      if ($(selectors.toggleBtn).hasClass(classes.isActive)) {
        closeNav();
      } else {
        openNav();
      }
    }
  
    function openNav() {
      $(selectors.toggleBtn).addClass(classes.isActive);
  
      $(selectors.navWrapper).prepareTransition().addClass(classes.isOpen);
  
      if (pageSlide) {
        $(selectors.container).css({
          transform:
            'translate3d(0, ' + $(selectors.navWrapper).height() + 'px, 0)'
        });
      }
  
      $(selectors.navWrapper).attr('tabindex', '-1').focus();
  
      // close on escape
      $(window).on('keyup' + namespace, function(evt) {
        if (evt.which === 27) {
          closeNav();
        }
      });
    }
  
    function closeNav() {
      $(selectors.toggleBtn).removeClass(classes.isActive);
      $(selectors.navWrapper).prepareTransition().removeClass(classes.isOpen);
  
      if (pageSlide) {
        $(selectors.container).removeAttr('style');
      }
  
      $(selectors.toggleBtn).focus();
  
      $(window).off('keyup' + namespace);
    }
  
    function toggleSubNav(evt) {
      if (isTransitioning) {
        return;
      }
  
      var $toggleBtn = $(evt.currentTarget);
      var isReturn = $toggleBtn.hasClass(classes.return);
      isTransitioning = true;
  
      if (isReturn) {
        // Close all subnavs by removing active class on buttons
        $(
          classes.toggleBtn + '[data-level="' + (menuLevel - 1) + '"]'
        ).removeClass(classes.isActive);
        $('.slide-nav__dropdown[data-level="' + (menuLevel) + '"]').prepareTransition().removeClass(classes.isActive);
  
        if ($activeTrigger && $activeTrigger.length) {
          $activeTrigger.removeClass(classes.isActive);
        }
      } else {
        $toggleBtn.addClass(classes.isActive);
        $toggleBtn.next('.slide-nav__dropdown').prepareTransition().addClass(classes.isActive);
      }
  
      $activeTrigger = $toggleBtn;
  
      goToSubnav($toggleBtn.data('target'));
    }
  
    function goToSubnav(target) {
      var $targetMenu = target
        ? $('.slide-nav__dropdown[data-parent="' + target + '"]')
        : $(selectors.nav);
  
      menuLevel = $targetMenu.data('level') ? $targetMenu.data('level') : 1;
  
      $activeSubNav = $targetMenu;
  
      var $elementToFocus = target
        ? $targetMenu.find('.' + classes.subNavLink + ':first')
        : $activeTrigger;
  
      var translateMenuHeight = $targetMenu.outerHeight();
  
      var openNavClass =
        menuLevel > 2 ? classes.thirdNavShowing : classes.subNavShowing;
  
      $(selectors.navWrapper)
        .css('height', translateMenuHeight)
        .removeClass(classes.thirdNavShowing)
        .addClass(openNavClass);
  
      if (!target) {
        // Show top level nav
        $(selectors.navWrapper)
          .removeClass(classes.thirdNavShowing)
          .removeClass(classes.subNavShowing);
      }
  
      isTransitioning = false;
  
      // Match height of subnav
      if (pageSlide) {
        $(selectors.container).css({
          transform: 'translate3d(0, ' + translateMenuHeight + 'px, 0)'
        });
      }
    }
  
    function unload() {
      $(window).off(namespace);
      $(selectors.toggleBtn).off(namespace);
      $(selectors.subNavToggleBtn).off(namespace);
    }
  
    return {
      init: init,
      unload: unload
    };
  })();
  
  theme.articleImages = (function() {
  
    var cache = {};
  
    function init() {
      cache.$rteImages = $('.rte--indented-images');
  
      if (!cache.$rteImages.length) {
        return;
      }
  
      $(window).on('load', setImages);
    }
  
    function setImages() {
      cache.$rteImages.find('img').each(function() {
        var $el = $(this);
        var attr = $el.attr('style');
  
        // Check if undefined or float: none
        if (!attr || attr == 'float: none;') {
          // Remove grid-breaking styles if image isn't wider than parent
          if ($el.width() < cache.$rteImages.width()) {
            $el.addClass('rte__no-indent');
          }
        }
      });
    }
  
    return {
      init: init
    };
  })();
  
  theme.Slideshow = (function() {
    this.$slideshow = null;
  
    var classes = {
      next: 'is-next',
      init: 'is-init',
      wrapper: 'slideshow-wrapper',
      slideshow: 'slideshow',
      currentSlide: 'slick-current',
      pauseButton: 'slideshow__pause',
      isPaused: 'is-paused'
    };
  
    function slideshow(el, args) {
      this.$slideshow = $(el);
      this.$wrapper = this.$slideshow.closest('.' + classes.wrapper);
      this.$pause = this.$wrapper.find('.' + classes.pauseButton);
  
      this.settings = {
        accessibility: true,
        arrows: args.arrows ? true : false,
        dots: args.dots ? true : false,
        draggable: true,
        touchThreshold: 8,
        speed: 300,
        pauseOnHover: args.pauseOnHover ? true : false,
        rtl: theme.config.rtl,
        autoplay: this.$slideshow.data('autoplay'),
        autoplaySpeed: this.$slideshow.data('speed')
      };
  
      this.$slideshow.on('init', this.init.bind(this));
  
      // Refresh main page slideshow
      if ($('.root').find(this.$slideshow).length) {
        $('body').on('productModalClose', function() {
          this.$slideshow.addClass('slideshow-refresh');
          this.$slideshow.slick('refresh');
        }.bind(this));
      }
  
      this.$slideshow.slick(this.settings);
  
      this.$pause.on('click', this._togglePause.bind(this));
    }
  
    slideshow.prototype = $.extend({}, slideshow.prototype, {
      init: function(event, obj) {
        this.$slideshowList = obj.$list;
        this.$slickDots = obj.$dots;
        this.$allSlides = obj.$slides;
        this.slideCount = obj.slideCount;
  
        this.$slideshow.addClass(classes.init);
        this._a11y();
        this._clonedLazyloading();
  
        // Hack to prevent (Firefox) from initializing with 0 width
        setTimeout(function() {
          this.$slideshow.slick('setPosition');
        }.bind(this), 50);
      },
      destroy: function() {
        this.$slideshow.slick('unslick');
      },
  
      // Playback
      _play: function() {
        this.$slideshow.slick('slickPause');
        $(classes.pauseButton).addClass('is-paused');
      },
      _pause: function() {
        this.$slideshow.slick('slickPlay');
        $(classes.pauseButton).removeClass('is-paused');
      },
      _togglePause: function() {
        var slideshowSelector = this._getSlideshowId(this.$pause);
        if (this.$pause.hasClass(classes.isPaused)) {
          this.$pause.removeClass(classes.isPaused);
          $(slideshowSelector).slick('slickPlay');
        } else {
          this.$pause.addClass(classes.isPaused);
          $(slideshowSelector).slick('slickPause');
        }
      },
  
      // Helpers
      _getSlideshowId: function($el) {
        return '#Slideshow-' + $el.data('id');
      },
      _activeSlide: function() {
        return this.$slideshow.find('.slick-active');
      },
      _currentSlide: function() {
        return this.$slideshow.find('.slick-current');
      },
      _nextSlide: function(index) {
        return this.$slideshow.find('.slideshow__slide[data-slick-index="' + index + '"]');
      },
  
      // a11y fixes
      _a11y: function() {
        var $list = this.$slideshowList;
        var autoplay = this.settings.autoplay;
  
        if (!$list) {
          return;
        }
  
        // Remove default Slick aria-live attr until slider is focused
        $list.removeAttr('aria-live');
  
        // When an element in the slider is focused
        // pause slideshow and set aria-live
        $(classes.wrapper).on('focusin', function(evt) {
          if (!$(classes.wrapper).has(evt.target).length) {
            return;
          }
  
          $list.attr('aria-live', 'polite');
          if (autoplay) {
            this._pause();
          }
        }.bind(this));
  
        // Resume autoplay
        $(classes.wrapper).on('focusout', function(evt) {
          if (!$(classes.wrapper).has(evt.target).length) {
            return;
          }
  
          $list.removeAttr('aria-live');
          if (autoplay) {
            this._play();
          }
        }.bind(this));
      },
  
      // Make sure lazyloading works on cloned slides
      _clonedLazyloading: function() {
        var $slideshow = this.$slideshow;
  
        $slideshow.find('.slick-slide').each(function(index, el) {
          var $slide = $(el);
          if ($slide.hasClass('slick-cloned')) {
            var slideId = $slide.data('id');
            var $slideImg = $slide.find('.hero__image').removeClass('lazyloading').addClass('lazyloaded');
  
            // Get inline style attribute from non-cloned slide with arbitrary timeout
            // so the image is loaded
            setTimeout(function() {
              var loadedImageStyle = $slideshow.find('.slideshow__slide--' + slideId + ':not(.slick-cloned) .hero__image').attr('style');
  
              if (loadedImageStyle) {
                $slideImg.attr('style', loadedImageStyle);
              }
  
            }, this.settings.autoplaySpeed / 1.5);
  
          }
        }.bind(this));
      }
    });
  
    return slideshow;
  })();
  
  /*
    Quick shop modals, or product screens, live inside
    product-grid-item markup until page load, where they're
    moved to #ProductScreens at the bottom of the page
   */
  
  theme.QuickShopScreens = (function() {
  
    var startingUrl = window.location.pathname;
    var currentPath = startingUrl;
    var prevPath = null;
    var currentScreen = null;
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  
    var selectors = {
      screensWrap: '#ProductScreens',
      screens: '[data-product-id]',
      trigger: '.quick-product__btn'
    };
  
    var activeIds = [];
  
    function init(container) {
      if (!theme.settings.quickView) {
        return;
      }
  
      var productIds = getProductIds();
      initProductScreens(productIds);
      initHistoryWatcher();
    }
  
    function initHistoryWatcher() {
      // No need to adjust URL in the editor since it handles the navigation
      if (Shopify.designMode) {
        return;
      }
  
      // Listen for product screens opening
      $(window).on('newPopstate', function(evt, data) {
        currentScreen = data.screen;
        // Manually trigger back, comes from esc key or close btns
        if (data.back) {
          prevPath = location.pathname;
          currentPath = startingUrl;
          history.pushState({}, '', startingUrl);
        }
  
        if (data.url) {
          if (data.updateCurrentPath) {
            prevPath = location.pathname;
            currentPath = data.url;
            history.pushState({}, '', data.url);
          }
        }
      });
  
      $(window).on('popstate', function(evt) {
        var goToUrl = false;
        prevPath = currentPath;
  
        // Hash change or no change, let browser take over
        if (location.pathname === currentPath) {
          return;
        }
  
        prevPath = currentPath;
        currentPath = location.pathname;
  
        // Back to where we started. Close existing screen if open
        if (location.pathname === startingUrl) {
          if (currentScreen && currentScreen.isOpen) {
            closeScreen(currentScreen);
          }
          return;
        }
  
        // Opening product
        if (location.pathname.indexOf('/products/') !== -1) {
          if (currentScreen) {
            currentScreen.open();
          } else {
            // No screen sent to function, trigger new click
            $('.quick-product__btn[href="'+ location.pathname +'"]').first().trigger('click', { updateCurrentPath: false });
          }
  
          return;
        }
  
        if (evt.originalEvent.state) {
          if (currentScreen && currentScreen.isOpen) {
            closeScreen(currentScreen);
            history.replaceState({}, '', startingUrl);
            return;
          }
  
          goToUrl = true;
        } else {
          if (currentScreen) {
            if (currentScreen.isOpen) {
              closeScreen(currentScreen);
              return;
            }
          } else {
            // No state/modal. Navigate to where browser wants
            goToUrl = true;
          }
        }
  
        // Fallback if none of our conditions are met
        if (goToUrl) {
          window.location.href = location.href;
        }
      }.bind(this));
    }
  
    function closeScreen(screen) {
      screen.close();
      currentScreen = null;
      $(window).trigger('resize');
    }
  
    function getProductIds($scope) {
      var ids = [];
  
      var $triggers = $scope ? $(selectors.trigger, $scope) : $(selectors.trigger);
  
      $triggers.each(function() {
        var id = $(this).data('product-id');
  
        // If another identical modal exists, remove from DOM
        if (ids.indexOf(id) > -1) {
          $('.screen-layer--product[data-product-id="' + id + '"]').slice(1).remove();
          return;
        }
  
        ids.push(id);
      });
  
      return ids;
    }
  
    function getIdsFromTriggers($triggers) {
      var ids = [];
  
      $triggers.each(function() {
        var id = $(this).data('product-id');
        ids.push(id);
      });
  
      return ids;
    }
  
    function initProductScreens(ids) {
      var screenId;
      var $screenLayer;
      var screens = [];
  
      // Init screens if they're not duplicates
      for (var i = 0; i < ids.length; i++) {
        if (activeIds.indexOf(ids[i]) === -1) {
          screenId = 'ProductScreen-' + ids[i];
          $screenLayer = $('#' + screenId);
  
          screens.push($screenLayer);
          activeIds.push(ids[i]);
          new theme.ProductScreen(screenId, 'product-' + ids[i]);
        }
      }
  
      // Append screens to bottom of page
      $(selectors.screensWrap).append(screens);
    }
  
    // Section unloaded in theme editor.
    // Check if product exists in any other area
    // of the page, remove other's section.instance
    function unload($container) {
      if (!theme.settings.quickView) {
        return;
      }
  
      var removeIds = [];
      var productIds = getProductIds($container);
  
      // Get ids from buttons not in removed section
      var $activeButtons = $(selectors.trigger).not($(selectors.trigger, $container));
      var stillActiveIds = getIdsFromTriggers($activeButtons);
  
      // If ID exists on active button, do not add to IDs to remove
      for (var i = 0; i < productIds.length; i++) {
        var id = productIds[i];
        if (stillActiveIds.indexOf(id) === -1) {
          removeIds.push(id);
        }
      }
  
      for (var i = 0; i < removeIds.length; i++) {
        sections._removeInstance(removeIds[i]);
      }
    }
  
    // Section container is sent, so must re-scrape for product IDs
    function reInit($container) {
      if (!theme.settings.quickView) {
        return;
      }
  
      var newProductIds = getProductIds($container);
      initProductScreens(newProductIds);
      removeDuplicateModals(newProductIds, $container);
  
      // Re-register product templates in quick view modals.
      // Will not double-register.
      sections.register('product-template', theme.Product, $('#ProductScreens'));
    }
  
    function removeDuplicateModals(ids, $container) {
      for (var i = 0; i < ids.length; i++) {
        $('.screen-layer--product[data-product-id="' + ids[i] + '"]', $container).remove();
      }
    }
  
    return {
      init: init,
      unload: unload,
      reInit: reInit
    };
  })();
  
  /*
    Hover to enable slideshow of product images.
    On mobile slideshow starts as item is in view.
    Destroy on mouseout/out of view.
   */
  
  theme.HoverProductGrid = (function() {
    var selectors = {
      product: '.grid-product',
      slider: '.product-slider',
    };
  
    function HoverProductGrid($container) {
      this.$container = $container;
      this.sectionId = this.$container.attr('data-section-id');
      this.namespace = '.product-image-slider-' + this.sectionId;
      this.activeIds = [];
  
      if (!theme.settings.hoverProductGrid) {
        return;
      }
  
      this.$products = $container.find(selectors.product);
      this.slidersMobile = $container.data('product-sliders-mobile');
  
      // No products means no sliders
      if (this.$products.length === 0) {
        return;
      }
  
      theme.utils.promiseStylesheet().then(function() {
        this.init();
      }.bind(this));
    }
  
    HoverProductGrid.prototype = $.extend({}, HoverProductGrid.prototype, {
      init: function() {
        this.destroyAllSliders();
        this.setupEventType();
        this.listnerSetup();
      },
  
      setupEventType: function() {
        this.$products.off('mouseenter mouseout');
        $(window).off('scroll' + this.namespace);
  
        if (theme.config.bpSmall) {
          if (this.slidersMobile) {
            $(window).on('scroll' + this.namespace, $.throttle(120, this.inViewSliderInit.bind(this)));
            $(window).trigger('scroll' + this.namespace);
          }
        } else {
          this.mouseSliderInit();
        }
      },
  
      listnerSetup: function() {
        $('body').on('matchSmall matchLarge', function() {
          this.destroyAllSliders();
          this.setupEventType();
        }.bind(this));
      },
  
      inViewSliderInit: function() {
        this.$products.find(selectors.slider).each(function(i, el) {
          if(theme.isElementVisible($(el), -400)) {
            this.initSlider($(el));
          } else {
            this.destroySlider($(el));
          }
        }.bind(this));
      },
  
      mouseSliderInit: function() {
        this.$products.on('mouseenter', function(evt) {
          var $slider = $(evt.currentTarget).find(selectors.slider);
          this.initSlider($slider);
        }.bind(this));
  
        this.$products.on('mouseleave', function(evt) {
          var $slider = $(evt.currentTarget).find(selectors.slider);
          this.destroySlider($slider);
        }.bind(this));
      },
  
      initSlider: function($slider) {
        if ($slider.data('image-count') < 2) {
          return;
        }
  
        if (this.activeIds.indexOf($slider.data('id')) !== -1) {
          return;
        }
  
        this.activeIds.push($slider.data('id'));
  
        $slider
          .addClass('product-slider--init')
          .slick({
            autoplay: true,
            infinite: true,
            arrows: false,
            speed: 300,
            fade: true,
            pauseOnHover: false,
            autoplaySpeed: 1050
          });
      },
  
      destroySlider: function($slider) {
        if ($slider.data('image-count') < 2) {
          return;
        }
  
        var alreadyActive = this.activeIds.indexOf($slider.data('id'));
        if (alreadyActive !== -1) {
          this.activeIds.splice(alreadyActive, 1);
          $slider.slick('unslick');
        }
      },
  
      destroyAllSliders: function() {
        this.$products.find(selectors.slider).each(function(i, el) {
          this.destroySlider($(el));
        }.bind(this));
      }
    });
  
    return HoverProductGrid;
  })();
  
  // Video modal will auto-initialize for any anchor link that points to YouTube
  // MP4 videos must manually be enabled with:
  //   - .product-video-trigger--mp4 (trigger button)
  //   - .product-video-mp4-sound video player element (cloned into modal)
  //     - see media.liquid for example of this
  theme.videoModal = function(reinit) {
    var youtubePlayer = null;
    var videoOptions = {
      width: 1280,
      height: 720,
      playerVars: {
        autohide: 0,
        autoplay: 1,
        branding: 0,
        cc_load_policy: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        quality: 'hd720',
        rel: 0,
        showinfo: 0,
        wmode: 'opaque'
      },
      events: {
        onReady: onPlayerReady
      }
    };
  
    var videoHolderId = 'VideoHolder';
    var activeVideo = false;
  
    var selectors = {
      videoHolder: '#' + videoHolderId,
      youtube: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]',
      mp4Trigger: '.product-video-trigger--mp4',
      mp4Player: '.product-video-mp4-sound'
    };
  
    if (!$(selectors.youtube).length && !$(selectors.mp4Trigger).length) {
      return;
    }
  
    var modal = new theme.Modals('VideoModal', 'video-modal', {
      closeOffContentClick: true,
      solid: true
    });
  
    if (reinit) {
      $(selectors.youtube).off('click');
      $(selectors.mp4Trigger).off('click');
    }
    $(selectors.youtube).on('click', triggerYouTubeModal);
    $(selectors.mp4Trigger).on('click', triggerMp4Modal);
  
    // Handle closing video modal
    if (reinit) {
      $('body').off('modalClose.VideoModal');
    }
    $('body').on('modalClose.VideoModal', function() {
      // Slight timeout so YouTube player is destroyed after the modal closes
      if (youtubePlayer && activeVideo === 'youtube') {
        setTimeout(function() {
          youtubePlayer.destroy();
        }, 500); // modal close css transition
      } else {
        emptyVideoHolder();
      }
    });
  
    function triggerYouTubeModal(evt) {
      emptyVideoHolder();
  
      evt.preventDefault();
      theme.LibraryLoader.load('youtubeSdk');
  
      if (theme.config.youTubeReady) {
        startYoutubeOnClick(evt);
      } else {
        $('body').on('youTubeReady', function() {
          startYoutubeOnClick(evt);
        });
      }
    }
  
    function triggerMp4Modal(evt) {
      emptyVideoHolder();
  
      var $el = $(evt.currentTarget);
      var $mp4Player = $el.next(selectors.mp4Player);
  
      $mp4Player.clone().removeClass('hide').appendTo(selectors.videoHolder);
  
      modal.open(evt);
  
      // Play new video element
      $(selectors.videoHolder).find('video')[0].play();
  
      activeVideo = 'mp4';
    }
  
    function startYoutubeOnClick(evt) {
      var $el = $(evt.currentTarget);
      var videoId = getYoutubeVideoId($el.attr('href'));
  
      var args = $.extend({}, videoOptions, {
        videoId: videoId
      });
  
      // Disable plays inline on mobile
      args.playerVars.playsinline = theme.config.bpSmall ? 0 : 1;
  
      youtubePlayer = new YT.Player(videoHolderId, args);
      modal.open(evt);
  
      activeVideo = 'youtube';
    }
  
    function onPlayerReady(evt) {
      evt.target.playVideo();
    }
  
    function getYoutubeVideoId(url) {
      var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      var match = url.match(regExp);
      return (match&&match[7].length==11)? match[7] : false;
    }
  
    function emptyVideoHolder() {
      $(selectors.videoHolder).empty();
    }
  };
  
  theme.Disclosure = (function() {
    var selectors = {
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]'
    };
  
    var classes = {
      listVisible: 'disclosure-list--visible'
    };
  
    function Disclosure($disclosure) {
      this.$container = $disclosure;
      this.cache = {};
      this._cacheSelectors();
      this._connectOptions();
      this._connectToggle();
      this._onFocusOut();
    }
  
    Disclosure.prototype = $.extend({}, Disclosure.prototype, {
      _cacheSelectors: function() {
        this.cache = {
          $disclosureList: this.$container.find(selectors.disclosureList),
          $disclosureToggle: this.$container.find(selectors.disclosureToggle),
          $disclosureInput: this.$container.find(selectors.disclosureInput),
          $disclosureOptions: this.$container.find(selectors.disclosureOptions)
        };
      },
  
      _connectToggle: function() {
        this.cache.$disclosureToggle.on(
          'click',
          function(evt) {
            var ariaExpanded =
              $(evt.currentTarget).attr('aria-expanded') === 'true';
            $(evt.currentTarget).attr('aria-expanded', !ariaExpanded);
  
            this.cache.$disclosureList.toggleClass(classes.listVisible);
          }.bind(this)
        );
      },
  
      _connectOptions: function() {
        this.cache.$disclosureOptions.on(
          'click',
          function(evt) {
            evt.preventDefault();
            this._submitForm($(evt.currentTarget).data('value'));
          }.bind(this)
        );
      },
  
      _onFocusOut: function() {
        this.cache.$disclosureToggle.on(
          'focusout',
          function(evt) {
            var disclosureLostFocus =
              this.$container.has(evt.relatedTarget).length === 0;
  
            if (disclosureLostFocus) {
              this._hideList();
            }
          }.bind(this)
        );
  
        this.cache.$disclosureList.on(
          'focusout',
          function(evt) {
            var childInFocus =
              $(evt.currentTarget).has(evt.relatedTarget).length > 0;
            var isVisible = this.cache.$disclosureList.hasClass(
              classes.listVisible
            );
  
            if (isVisible && !childInFocus) {
              this._hideList();
            }
          }.bind(this)
        );
  
        this.$container.on(
          'keyup',
          function(evt) {
            if (evt.which !== 27) return;
            this._hideList();
            this.cache.$disclosureToggle.focus();
          }.bind(this)
        );
  
        $('body').on(
          'click',
          function(evt) {
            var isOption = this.$container.has(evt.target).length > 0;
            var isVisible = this.cache.$disclosureList.hasClass(
              classes.listVisible
            );
  
            if (isVisible && !isOption) {
              this._hideList();
            }
          }.bind(this)
        );
      },
  
      _submitForm: function(value) {
        $('body').addClass('unloading');
        this.cache.$disclosureInput.val(value);
        this.$container.parents('form').submit();
      },
  
      _hideList: function() {
        this.cache.$disclosureList.removeClass(classes.listVisible);
        this.cache.$disclosureToggle.attr('aria-expanded', false);
      },
  
      unload: function() {
        this.cache.$disclosureOptions.off();
        this.cache.$disclosureToggle.off();
        this.cache.$disclosureList.off();
        this.$container.off();
      }
    });
  
    return Disclosure;
  })();
  
  theme.ProductMedia = (function() {
    var modelJsonSections = {};
    var models = {};
    var xrButtons = {};
  
    var selectors = {
      mediaGroup: '[data-product-single-media-group]',
      xrButton: '[data-shopify-xr]'
    };
  
    function init(modelViewerContainers, sectionId) {
      modelJsonSections[sectionId] = {
        loaded: false
      };
  
      modelViewerContainers.each(function(index) {
        var $modelViewerContainer = $(this);
        var mediaId = $modelViewerContainer.data('media-id');
        var $modelViewerElement = $(
          $modelViewerContainer.find('model-viewer')[0]
        );
        var modelId = $modelViewerElement.data('model-id');
  
        if (index === 0) {
          var $xrButton = $modelViewerContainer
            .closest(selectors.mediaGroup)
            .find(selectors.xrButton);
          xrButtons[sectionId] = {
            $element: $xrButton,
            defaultId: modelId
          };
        }
  
        models[mediaId] = {
          modelId: modelId,
          sectionId: sectionId,
          $container: $modelViewerContainer,
          $element: $modelViewerElement
        };
      });
  
      window.Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: setupShopifyXr
        },
        {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: setupModelViewerUi
        }
      ]);
  
      theme.LibraryLoader.load('modelViewerUiStyles');
    }
  
    function setupShopifyXr(errors) {
      if (errors) return;
  
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', function() {
          setupShopifyXr();
        });
        return;
      }
  
      for (var sectionId in modelJsonSections) {
        if (modelJsonSections.hasOwnProperty(sectionId)) {
          var modelSection = modelJsonSections[sectionId];
  
          if (modelSection.loaded) continue;
          var $modelJson = $('#ModelJson-' + sectionId);
  
          window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
          modelSection.loaded = true;
        }
      }
      window.ShopifyXR.setupXRElements();
    }
  
    function setupModelViewerUi(errors) {
      if (errors) return;
  
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (!model.modelViewerUi && Shopify) {
            model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
          }
          setupModelViewerListeners(model);
        }
      }
    }
  
    function setupModelViewerListeners(model) {
      var xrButton = xrButtons[model.sectionId];
      model.$container.on('mediaVisible', function() {
        xrButton.$element.attr('data-shopify-model3d-id', model.modelId);
        if (theme.config.isTouch) return;
        model.modelViewerUi.play();
      });
  
      model.$container
        .on('mediaHidden', function() {
          xrButton.$element.attr('data-shopify-model3d-id', xrButton.defaultId);
          model.modelViewerUi.pause();
        })
        .on('xrLaunch', function() {
          model.modelViewerUi.pause();
        });
    }
  
    function removeSectionModels(sectionId) {
      for (var key in models) {
        if (models.hasOwnProperty(key)) {
          var model = models[key];
          if (model.sectionId === sectionId) {
            delete models[key];
          }
        }
      }
      delete modelJsonSections[sectionId];
    }
  
    return {
      init: init,
      removeSectionModels: removeSectionModels
    };
  })();
  

  theme.customerTemplates = (function() {
  
    function initEventListeners() {
      // Show reset password form
      $('#RecoverPassword').on('click', function(evt) {
        evt.preventDefault();
        toggleRecoverPasswordForm();
      });
  
      // Hide reset password form
      $('#HideRecoverPasswordLink').on('click', function(evt) {
        evt.preventDefault();
        toggleRecoverPasswordForm();
      });
    }
  
    /**
     *
     *  Show/Hide recover password form
     *
     */
    function toggleRecoverPasswordForm() {
      $('#RecoverPasswordForm').toggleClass('hide');
      $('#CustomerLoginForm').toggleClass('hide');
    }
  
    /**
     *
     *  Show reset password success message
     *
     */
    function resetPasswordSuccess() {
      var $formState = $('.reset-password-success');
  
      // check if reset password form was successfully submitted
      if (!$formState.length) {
        return;
      }
  
      // show success message
      $('#ResetSuccess').removeClass('hide');
    }
  
    /**
     *
     *  Show/hide customer address forms
     *
     */
    function customerAddressForm() {
      var $newAddressForm = $('#AddressNewForm');
      var $addressForms = $('.js-address-form');
  
      if (!$newAddressForm.length || !$addressForms.length) {
        return;
      }
  
      if (Shopify) {
        $('.js-address-country').each(function() {
          var $container = $(this);
          var countryId = $container.data('country-id');
          var provinceId = $container.data('province-id');
          var provinceContainerId = $container.data('province-container-id');
  
          if (Shopify) {
            new Shopify.CountryProvinceSelector(
              countryId,
              provinceId,
              {
                hideElement: provinceContainerId
              }
            );
          }
        });
      }
  
      // Toggle new/edit address forms
      $('.address-new-toggle').on('click', function() {
        $newAddressForm.toggleClass('hide');
      });
  
      $('.address-edit-toggle').on('click', function() {
        var formId = $(this).data('form-id');
        $('#EditAddress_' + formId).toggleClass('hide');
      });
  
      $('.address-delete').on('click', function() {
        var $el = $(this);
        var formId = $el.data('form-id');
        var confirmMessage = $el.data('confirm-message');
  
        if (confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
          if (Shopify) {
            Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
          }
        }
      });
    }
  
    /**
     *
     *  Check URL for reset password hash
     *
     */
    function checkUrlHash() {
      var hash = window.location.hash;
  
      // Allow deep linking to recover password form
      if (hash === '#recover') {
        toggleRecoverPasswordForm();
      }
    }
  
    return {
      init: function() {
        checkUrlHash();
        initEventListeners();
        resetPasswordSuccess();
        customerAddressForm();
      }
    };
  })();
  

  theme.Product = (function() {
  
    var classes = {
      onSale: 'sale-price',
      disabled: 'disabled',
      isModal: 'is-modal',
      loading: 'loading',
      loaded: 'loaded',
      hidden: 'hide',
      interactable: 'video-interactable',
      visuallyHide: 'visually-invisible',
      thumbActive: 'thumb--current'
    };
  
    var selectors = {
      variantsJson: '[data-variant-json]',
      currentVariantJson: '[data-current-variant-json]',
  
      imageContainer: '[data-product-images]',
      mainSlider: '[data-product-photos]',
      thumbSlider: '[data-product-thumbs]',
      photo: '[data-product-photo]',
      photoThumbs: '[data-product-thumb]',
      photoThumbItem: '[data-product-thumb-item]',
      zoomButton: '.product__photo-zoom',
  
      priceWrapper: '[data-price-wrapper]',
      price: '[data-product-price]',
      comparePrice: '[data-product-price-compare]',
      priceA11y: '[data-price-a11y]',
      comparePriceA11y: '[data-compare-a11y]',
      sku: '[data-sku]',
      inventory: '[data-product-inventory]',
      incomingInventory: '[data-product-incoming-inventory]',
      unitWrapper: '[data-product-unit-wrapper]',
  
      addToCart: '[data-add-to-cart]',
      addToCartText: '[data-add-to-cart-text]',
  
      originalSelectorId: '[data-product-select]',
      singleOptionSelector: '[data-variant-input]',
      variantColorSwatch: '[data-color-swatch]',
  
      productImageMain: '.product-image-main',
      dotsContainer: '.product__photo-dots',
      productVideo: '[data-product-video]',
      videoParent: '.product__video-wrapper',
      currentSlide: '.slick-current',
      startingSlide: '.starting-slide',
  
      media: '[data-product-media-type-model]',
      closeMedia: '.product-single__close-media',
  
      modalFormHolder: '#ProductFormPlaceholder-',
      formContainer: '.product-single__form',
      availabilityContainer: '[data-store-availability]'
    };
  
    var youtubeReady;
    var videos = {};
    var youtubePlayers = [];
    var youtubeVideoOptions = {
      height: '480',
      width: '850',
      playerVars :{
        autohide: 0,
        autoplay: 0,
        branding: 0,
        cc_load_policy: 0,
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        quality: 'hd720',
        rel: 0,
        showinfo: 0,
        wmode: 'opaque'
      }
    };
  
    function onVideoPlayerReady(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      youtubePlayers[playerId] = evt.target; // update stored player
      var player = youtubePlayers[playerId];
  
      setParentAsLoading($player);
  
      if (videos[playerId].style === 'muted') {
        youtubePlayers[playerId].mute();
      }
  
      setParentAsLoaded($player);
  
      // If first slide or only photo, start video
      if ($player.closest(selectors.startingSlide).length || $player.data('image-count') === 1) {
        if (videos[playerId].style === 'muted') {
          youtubePlayers[playerId].playVideo();
          initCheckVisibility(playerId);
        }
      }
    }
  
    function initCheckVisibility(playerId) {
      if (!playerId) {
        return;
      }
  
      // Add out of view pausing
      videoVisibilityCheck(playerId);
      $(window).on('scroll.' + playerId, {id: playerId}, $.throttle(150, videoVisibilityCheck));
    }
  
    function videoVisibilityCheck(id) {
      var playerId;
  
      if (!id) {
        return;
      }
  
      if (typeof id === 'string') {
        playerId = id;
      } else {
        // Data comes in as part of the scroll event
        if (!id.data) {return}
        playerId = id.data.id;
      }
  
      if (theme.isElementVisible($('#' + playerId))) {
        if (videos[playerId] && videos[playerId].style === 'unmuted') {
          return;
        }
        playVisibleVideo(playerId);
      } else {
        pauseHiddenVideo(playerId);
      }
    }
  
    function playVisibleVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
        youtubePlayers[id].playVideo();
      }
    }
  
    function pauseHiddenVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
        youtubePlayers[id].pauseVideo();
      }
    }
  
    function onVideoStateChange(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      var player = youtubePlayers[playerId];
  
      switch (evt.data) {
        case -1: // unstarted
          // Handle low power state on iOS by checking if
          // video is reset to unplayed after attempting to buffer
          if (videos[playerId].attemptedToPlay) {
            setParentAsLoaded($player);
            setVideoToBeInteractedWith($player);
          }
          break;
        case 0: // ended
          if (videos[playerId] && videos[playerId].loop) {
            player.playVideo();
          }
          break;
        case 1: // playing
          setParentAsLoaded($player);
          break;
        case 3: // buffering
          videos[playerId].attemptedToPlay = true;
          break;
      }
    }
  
    function setParentAsLoading($el) {
      $el
        .closest(selectors.videoParent)
        .addClass(classes.loading);
    }
  
    function setParentAsLoaded($el) {
      $el
        .closest(selectors.videoParent)
        .removeClass(classes.loading)
        .addClass(classes.loaded);
    }
  
    function setVideoToBeInteractedWith($el) {
      $el
        .closest(selectors.videoParent)
        .addClass(classes.interactable);
    }
  
    function Product(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');
  
      this.inModal = $container.closest('.screen-layer').length;
      this.$modal;
  
      this.namespace = '.product-' + sectionId;
      this.namespaceImages = '.product-image-' + sectionId;
  
      this.settings = {
        enableHistoryState: $container.data('enable-history-state') || false,
        namespace: '.product-' + sectionId,
        variantType: $container.data('variant-type'),
        inventory: $container.data('inventory') || false,
        inventoryThreshold: $container.data('inventory-threshold') || false,
        incomingInventory: $container.data('incoming-inventory') || false,
        modalInit: false,
        slickMainInitialized: false,
        slickThumbInitialized: false,
        hasImages: true,
        hasVideos: $container.find(selectors.productVideo).length || false,
        videoStyle: $container.data('video-style'),
        has3d: false,
        hasMultipleImages: false,
        imageSetName: null,
        imageSetIndex: null,
        currentImageSet: null,
        stackedImages: $container.data('images-stacked') || false,
        stackedCurrent: 0,
        stackedImagePositions: [],
        imageSize: '620x',
        videoLooping: $container.data('video-looping')
      };
  
      this.videos = {};
  
      // Overwrite some settings when loaded in modal
      if (this.inModal) {
        this.settings.enableHistoryState = false;
        this.namespace = '.product-' + sectionId + '-modal';
        this.$modal = $('#ProductScreen-' + sectionId);
      }
  
      this.init();
    }
  
    Product.prototype = $.extend({}, Product.prototype, {
      init: function() {
        this.$mainSlider = $(selectors.mainSlider, this.$container);
        this.$thumbSlider = $(selectors.thumbSlider, this.$container);
        this.$firstProductImage = this.$mainSlider.find('img').first();
        this.$formHolder = $(selectors.modalFormHolder + this.sectionId);
  
        if (!this.$firstProductImage.length) {
          this.settings.hasImages = false;
        }
  
        this.settings.imageSetName = this.$mainSlider.find('[data-set-name]').data('set-name');
  
        if (this.inModal) {
          this.$container.addClass(classes.isModal);
          $('body')
            .off('productModalOpen.ProductScreen-' + this.sectionId)
            .off('productModalClose.ProductScreen-' + this.sectionId);
          $('body').on('productModalOpen.ProductScreen-' + this.sectionId, this.openModalProduct.bind(this));
          $('body').on('productModalClose.ProductScreen-' + this.sectionId, this.closeModalProduct.bind(this));
        }
  
        if (!this.inModal) {
          this.formSetup();
          this.preImageSetup();
  
          this.checkIfVideos();
          this.imageSetup(true);
        }
      },
  
      formSetup: function() {
        // Determine how to handle variant availability selectors
        if (theme.settings.dynamicVariantsEnable) {
          this.$variantSelectors = $(selectors.formContainer, this.$container).find(selectors.singleOptionSelector);
        }
  
        this.initAjaxProductForm();
        this.availabilitySetup();
        this.initVariants();
  
        // We know the current variant now so setup image sets
        if (this.settings.imageSetName) {
          this.updateImageSet();
        }
      },
  
      availabilitySetup: function() {
        var availabilityContainer = this.$container[0].querySelector(selectors.availabilityContainer);
        if (availabilityContainer) {
          this.storeAvailability = new theme.StoreAvailability(availabilityContainer);
        }
      },
  
      initVariants: function() {
        var $variantJson = $(selectors.variantsJson, this.$container);
        if (!$variantJson.length) {
          return;
        }
  
        this.variantsObject = JSON.parse($variantJson[0].innerHTML);
  
        var options = {
          $container: this.$container,
          enableHistoryState: this.settings.enableHistoryState,
          singleOptionSelector: selectors.singleOptionSelector,
          originalSelectorId: selectors.originalSelectorId,
          variants: this.variantsObject
        };
  
        if ($(selectors.variantColorSwatch, this.$container).length) {
          $(selectors.variantColorSwatch, this.$container).on('change', function(evt) {
            var $el = $(evt.currentTarget);
            var color = $el.data('color-name');
            var index = $el.data('color-index');
            this.updateColorName(color, index);
          }.bind(this));
        }
  
        this.variants = new theme.Variants(options);
  
        // Product availability on page load
        if (this.storeAvailability) {
          var variant_id = this.variants.currentVariant ? this.variants.currentVariant.id : this.variants.variants[0].id;
  
          this.storeAvailability.updateContent(variant_id);
          this.$container.on('variantChange' + this.settings.namespace, this.updateAvailability.bind(this));
        }
  
        this.$container
          .on('variantChange' + this.namespace, this.updateCartButton.bind(this))
          .on('variantImageChange' + this.namespace, this.updateVariantImage.bind(this))
          .on('variantPriceChange' + this.namespace, this.updatePrice.bind(this))
          .on('variantUnitPriceChange' + this.namespace, this.updateUnitPrice.bind(this));
  
        if ($(selectors.sku, this.$container).length) {
          this.$container.on('variantSKUChange' + this.namespace, this.updateSku.bind(this));
        }
        if (this.settings.inventory || this.settings.incomingInventory) {
          this.$container.on('variantChange' + this.namespace, this.updateInventory.bind(this));
        }
  
        // Update individual variant availability on each selection
        var $currentVariantJson = $(selectors.currentVariantJson, this.$container);
  
        if (theme.settings.dynamicVariantsEnable && $currentVariantJson.length) {
          this.currentVariantObject = JSON.parse($currentVariantJson[0].innerHTML);
  
          this.$variantSelectors.on('change' + this.namespace, this.updateVariantAvailability.bind(this));
  
          // Set default state based on current selected variant
          this.setCurrentVariantAvailability(this.currentVariantObject, true);
        }
  
        if (this.settings.imageSetName) {
          this.settings.imageSetIndex = $(selectors.formContainer, this.$container).find('.variant-input-wrap[data-handle="'+this.settings.imageSetName+'"]').data('index');
          this.$container.on('variantChange' + this.settings.namespace, this.updateImageSet.bind(this))
        }
      },
  
      initAjaxProductForm: function() {
        if (theme.settings.cartType === 'drawer' || theme.settings.cartType === 'sticky') {
          new theme.AjaxProduct($(selectors.formContainer, this.$container));
        }
      },
  
      /*============================================================================
        Variant change methods
      ==============================================================================*/
      updateColorName: function(color, index) {
        // Updates on radio button change, not variant.js
        $('#VariantColorLabel-' + this.sectionId + '-' + index).text(color);
      },
  
      updateCartButton: function(evt) {
        var variant = evt.variant;
  
        if (variant) {
          if (variant.available) {
            // Available, enable the submit button and change text
            $(selectors.addToCart, this.$container).removeClass(classes.disabled).prop('disabled', false);
            var defaultText = $(selectors.addToCartText, this.$container).data('default-text');
            $(selectors.addToCartText, this.$container).html(defaultText);
          } else {
            // Sold out, disable the submit button and change text
            $(selectors.addToCart, this.$container).addClass(classes.disabled).prop('disabled', true);
            $(selectors.addToCartText, this.$container).html(theme.strings.soldOut);
          }
        } else {
          // The variant doesn't exist, disable submit button
          $(selectors.addToCart, this.$container).addClass(classes.disabled).prop('disabled', true);
          $(selectors.addToCartText, this.$container).html(theme.strings.unavailable);
        }
      },
  
      updatePrice: function(evt) {
        var variant = evt.variant;
  
        if (variant) {
          // Regular price
          $(selectors.price, this.$container).html(theme.Currency.formatMoney(variant.price, theme.settings.moneyFormat)).show();
  
          // Sale price, if necessary
          if (variant.compare_at_price > variant.price) {
            $(selectors.comparePrice, this.$container).html(theme.Currency.formatMoney(variant.compare_at_price, theme.settings.moneyFormat));
            $(selectors.priceWrapper, this.$container).removeClass('hide');
            $(selectors.price, this.$container).addClass(classes.onSale);
            $(selectors.comparePriceA11y, this.$container).attr('aria-hidden', 'false');
            $(selectors.priceA11y, this.$container).attr('aria-hidden', 'false');
          } else {
            $(selectors.priceWrapper, this.$container).addClass('hide');
            $(selectors.price, this.$container).removeClass(classes.onSale);
            $(selectors.comparePriceA11y, this.$container).attr('aria-hidden', 'true');
            $(selectors.priceA11y, this.$container).attr('aria-hidden', 'true');
          }
        }
      },
  
      updateUnitPrice: function(evt) {
        var variant = evt.variant;
  
        if (variant && variant.unit_price) {
          var price = theme.Currency.formatMoney(variant.unit_price, theme.settings.moneyFormat);
          var base = theme.Currency.getBaseUnit(variant);
  
          $(selectors.unitWrapper, this.$container)
            .html(price + '/' + base)
            .removeClass('hide').removeClass(classes.visuallyHide);
        } else {
          $(selectors.unitWrapper, this.$container).addClass(classes.visuallyHide);
        }
      },
  
      updateImageSet: function(evt, reload) {
        // If called directly, use current variant
        var variant = evt ? evt.variant : (this.variants ? this.variants.currentVariant : null);
        if (!variant) {
          return;
        }
  
        var groupIndex = this.settings.imageSetIndex;
        if (!groupIndex) {
          return;
        }
  
        var setValue = this.getImageSetName(variant[groupIndex]);
  
        // Already on the current image group so return early,
        // except if `reload` is specifically passed
        if (!reload && this.settings.currentImageSet === setValue) {
          return;
        }
  
        var set = this.settings.imageSetName + '_' + setValue;
  
        if (!theme.config.bpSmall && this.settings.stackedImages) {
          // Hide all thumbs and main images that are part of group
          $('[data-group]', this.$container).addClass('hide');
          // Show appropriate group
          $('[data-group="'+set+'"]', this.$container).removeClass('hide');
  
          // reset stacked position
          this.stackedImagePositions();
          AOS.refresh();
          this.settings.currentImageSet = setValue;
          return;
        } else {
          if (this.settings.slickMainInitialized) {
            // No css-hiding of slick slides (if coming from mobile breakpoint)
            $('[data-group]', this.$container).removeClass('hide');
            this.$mainSlider.slick('slickUnfilter');
            this.$mainSlider.slick('slickFilter', '[data-group="'+set+'"]').slick('refresh');
            this.settings.currentImageSet = setValue;
          }
        }
  
        // Thumbnails only on large screens, so ignore on mobile
        if (theme.config.bpSmall) {
          return;
        }
  
        if (!this.settings.stackedImages) {
          if (this.settings.slickThumbInitialized) {
            this.$thumbSlider.slick('slickUnfilter');
            this.$thumbSlider.slick('slickFilter', '[data-group="'+set+'"]').slick('refresh');
            this.settings.currentImageSet = setValue;
          }
        }
      },
  
      getImageSetName: function(string) {
        return string.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
      },
  
      updateSku: function(evt) {
        var variant = evt.variant;
        var newSku = '';
  
        if (variant) {
          if (variant.sku) {
            newSku = variant.sku;
          }
  
          $(selectors.sku, this.$container).html(newSku);
        }
      },
  
      updateInventory: function(evt) {
        var variant = evt.variant;
  
        // Hide stock if no inventory management or policy is continue
        if (!variant || !variant.inventory_management || variant.inventory_policy === 'continue') {
          this.toggleInventoryQuantity(false);
          this.toggleIncomingInventory(false);
          return;
        }
  
        if (variant.inventory_management === 'shopify' && window.inventories && window.inventories[this.sectionId]) {
          variantInventoryObject = window.inventories[this.sectionId][variant.id];
          var quantity = variantInventoryObject.quantity;
          var showInventory = true;
          var showIncomingInventory = false;
  
          if (quantity <= 0 || quantity > this.settings.inventoryThreshold) {
            showInventory = false;
          }
  
          this.toggleInventoryQuantity(showInventory, quantity);
  
          // Only show incoming inventory when:
          // - inventory notice itself is hidden
          // - have incoming inventory
          // - current quantity is below theme setting threshold
          if (!showInventory && variantInventoryObject.incoming && quantity <= theme.settings.inventoryThreshold) {
            showIncomingInventory = true;
          }
  
          this.toggleIncomingInventory(showIncomingInventory, variant.available, variantInventoryObject.next_incoming_date);
        }
      },
  
      updateAvailability: function(evt) {
        var variant = evt.variant;
        if (!variant) {
          return;
        }
  
        this.storeAvailability.updateContent(variant.id);
      },
  
      toggleInventoryQuantity: function(show, qty) {
        if (!this.settings.inventory) {
          show = false;
        }
  
        if (show) {
          $(selectors.inventory, this.$container)
            .removeClass('hide')
            .text(theme.strings.stockLabel.replace('[count]', qty));
        } else {
          $(selectors.inventory, this.$container).addClass('hide');
        }
      },
  
      toggleIncomingInventory: function(show, available, date) {
        if (!this.settings.incomingInventory) {
          show = false;
        }
  
        if (show) {
          var string = available ?
                       theme.strings.willNotShipUntil.replace('[date]', date) :
                       theme.strings.willBeInStockAfter.replace('[date]', date);
  
          if (!date) {
            string = theme.strings.waitingForStock;
          }
  
          $(selectors.incomingInventory, this.$container)
            .removeClass('hide')
            .text(string);
        } else {
          $(selectors.incomingInventory, this.$container).addClass('hide');
        }
      },
  
      /*============================================================================
        Product videos
      ==============================================================================*/
      checkIfVideos: function() {
        var $productVideos = this.$mainSlider.find(selectors.productVideo);
  
        // Stop if there are 0 videos
        if (!$productVideos.length) {
          return false;
        }
  
        var videoTypes = [];
  
        $productVideos.each(function() {
          var type = $(this).data('video-type');
  
          if (videoTypes.indexOf(type) < 0) {
            videoTypes.push(type);
          }
        });
  
        // Load YouTube API if not already loaded
        if (videoTypes.indexOf('youtube') > -1) {
          if (!theme.config.youTubeReady) {
            theme.LibraryLoader.load('youtubeSdk');
            $('body').on('youTubeReady' + this.namespace, function() {
              this.loadYoutubeVideos($productVideos);
            }.bind(this));
          } else {
            this.loadYoutubeVideos($productVideos);
          }
        }
  
        // Add mp4 video players
        if (videoTypes.indexOf('mp4') > -1) {
          this.loadMp4Videos($productVideos);
        }
  
        return videoTypes;
      },
  
      initVideo: function($video) {
        var videoType = $video.data('video-type');
        var divId = $video.attr('id');
  
        if (videoType === 'mp4' && videos[divId].style === 'muted') {
          this.playMp4Video(divId);
        }
  
        if (videoType === 'youtube') {
          if (youtubeReady && videos[divId].style === 'muted') {
            this.requestToPlayYoutubeVideo(divId);
          }
        }
  
        // Hacky way to trigger resetting the slider layout in modals
        if (this.inModal) {
          this.resizeSlides();
        }
      },
  
      stopVideo: function(id, type) {
        if (!id) {
          this.stopYoutubeVideo();
          this.stopMp4Video();
        }
  
        if (type === 'youtube') {
          this.stopYoutubeVideo(id);
        }
  
        if (type === 'mp4') {
          this.stopMp4Video(id);
        }
      },
  
      getVideoType: function($video) {
        return $video.data('video-type');
      },
  
      getVideoId: function($video) {
        return $video.attr('id');
      },
  
      loadMp4Videos: function($videos) {
        $videos.each(function(evt, el) {
          var $el = $(el);
          if ($el.data('video-type') != 'mp4') {
            return;
          }
  
          var id = $el.attr('id');
          var videoId = $el.data('video-id');
  
          videos[id] = this.videos[id] = {
            type: 'mp4',
            divId: id,
            style: $el.data('video-style')
          };
        }.bind(this));
      },
  
      loadYoutubeVideos: function($videos) {
        $videos.each(function(evt, el) {
          var $el = $(el);
  
          if ($el.data('video-type') != 'youtube') {
            return;
          }
  
          var id = $el.attr('id');
          var videoId = $el.data('youtube-id');
  
          videos[id] = this.videos[id] = {
            type: 'youtube',
            id: id,
            videoId: videoId,
            style: $el.data('video-style'),
            loop: $el.data('video-loop'),
            attemptedToPlay: false,
            events: {
              onReady: function(evt) {
                onVideoPlayerReady(evt, id);
              },
              onStateChange: function(evt) {
                onVideoStateChange(evt, id);
              }
            }
          };
        }.bind(this));
  
        // Create a player for each YouTube video
        for (var key in videos) {
          if (videos[key].type === 'youtube') {
            if (videos.hasOwnProperty(key)) {
              var args = $.extend({}, youtubeVideoOptions, videos[key]);
  
              if (args.style === 'muted') {
                // default youtubeVideoOptions, no need to change anything
              } else {
                args.playerVars.controls = 1;
                args.playerVars.autoplay = 0;
              }
  
              // Do not setup same player again
              if (!youtubePlayers[key]) {
                youtubePlayers[key] = new YT.Player(key, args);
              }
            }
          }
        }
  
        youtubeReady = true;
      },
  
      // Sub video functions (MP4 and YouTube)
      requestToPlayYoutubeVideo: function(id, forcePlay) {
        if (!theme.config.youTubeReady) {
          return;
        }
  
        var $player = $('#' + id);
        setParentAsLoading($player);
  
        // If video is requested too soon, player might not be ready.
        // Set arbitrary timeout to request it again in a second
        if (typeof youtubePlayers[id].playVideo != 'function') {
          setTimeout(function() {
            this.playYoutubeVideo(id, forcePlay);
          }.bind(this), 1000);
          return;
        }
  
        this.playYoutubeVideo(id, forcePlay);
      },
  
      playYoutubeVideo: function (id, forcePlay) {
        var $player = $('#' + id);
        setParentAsLoaded($player);
  
        if (typeof youtubePlayers[id].playVideo === 'function') {
          youtubePlayers[id].playVideo();
        }
  
        // forcePlay is sent as true from beforeSlideChange so the visibility
        // check isn't fooled by the next slide positioning
        if (!forcePlay) {
          initCheckVisibility(id);
        }
      },
  
      stopYoutubeVideo: function(id) {
        if (!theme.config.youTubeReady) {
          return;
        }
  
        if (id && youtubePlayers[id]) {
          if (typeof youtubePlayers[id].pauseVideo === 'function') {
            youtubePlayers[id].pauseVideo();
          }
          $(window).off('scroll.' + id);
        } else {
          for (key in youtubePlayers) {
            var $childVideo = this.$container.find('#' + key);
            if ($childVideo.length && typeof youtubePlayers[key].pauseVideo === 'function') {
              youtubePlayers[key].pauseVideo();
              $(window).off('scroll.' + key);
            }
          }
        }
      },
  
      playMp4Video: function(id) {
        var $player = $('#' + id);
        setParentAsLoaded($player);
  
        var playPromise = $player[0].play();
  
        if (playPromise !== undefined) {
          playPromise.then(function() {})
          .catch(function(error) {
            // Likely low power mode on iOS, show controls
            $player[0].setAttribute('controls', '');
            $player.closest(selectors.videoParent).attr('data-video-style', 'unmuted');
          });
        }
      },
  
      stopMp4Video: function(id) {
        if (id) {
          $('#' + id)[0].pause();
        } else {
          // loop through all mp4 videos to stop them
          for (var key in videos) {
            var childVideo = this.$container.find('#' + key);
            if (childVideo.length && videos[key].type === 'mp4') {
              var player = $('#' + videos[key].divId)[0];
              if (player && typeof player.pause === 'function') {
                player.pause();
              }
            }
          }
        }
      },
  
      /*============================================================================
        Dynamic variant availability
          - To disable, set dynamicVariantsEnable to false in theme.liquid
      ==============================================================================*/
      setCurrentVariantAvailability: function(variant) {
        var valuesToEnable = {
          option1: [],
          option2: [],
          option3: []
        };
  
        // Disable all options to start
        this.disableVariantGroup($(selectors.formContainer, this.$container).find('.variant-input-wrap'));
  
        // Combine all available variants
        var availableVariants = this.variantsObject.filter(function(el) {
          if (variant.id === el.id) {
            return false;
          }
  
          // Option 1
          if (variant.option2 === el.option2 && variant.option3 === el.option3) {
            return true;
          }
  
          // Option 2
          if (variant.option1 === el.option1 && variant.option3 === el.option3) {
            return true;
          }
  
          // Option 3
          if (variant.option1 === el.option1 && variant.option2 === el.option2) {
            return true;
          }
        });
  
  
        // IE11 can't handle shortform of {variant} so extra step is needed
        var variantObject = {
          variant: variant
        };
  
        availableVariants = Object.assign({}, variantObject, availableVariants);
  
        // Loop through each available variant to gather variant values
        for (var property in availableVariants) {
          if (availableVariants.hasOwnProperty(property)) {
            var item = availableVariants[property];
            var option1 = item.option1;
            var option2 = item.option2;
            var option3 = item.option3;
  
            if (option1) {
              if (valuesToEnable.option1.indexOf(option1) === -1) {
                valuesToEnable.option1.push(option1);
              }
            }
            if (option2) {
              if (valuesToEnable.option2.indexOf(option2) === -1) {
                valuesToEnable.option2.push(option2);
              }
            }
            if (option3) {
              if (valuesToEnable.option3.indexOf(option3) === -1) {
                valuesToEnable.option3.push(option3);
              }
            }
          }
        }
  
        // Have values to enable, separated by option index
        if (valuesToEnable.option1.length) {
          this.enableVariantOptionByValue(valuesToEnable.option1, 'option1');
        }
        if (valuesToEnable.option2.length) {
          this.enableVariantOptionByValue(valuesToEnable.option2, 'option2');
        }
        if (valuesToEnable.option3.length) {
          this.enableVariantOptionByValue(valuesToEnable.option3, 'option3');
        }
      },
  
      updateVariantAvailability: function(evt, value, index) {
        if (value && index) {
          var newVal = value;
          var optionIndex = index;
        } else {
          var $el = $(evt.currentTarget);
          var newVal = $el.val() ? $el.val() : evt.currentTarget.value;
          var optionIndex = $el.data('index');
        }
  
        var variants = this.variantsObject.filter(function(el) {
          return el[optionIndex] === newVal;
        });
  
        // Disable all buttons/dropdown options that aren't the current index
        $(selectors.formContainer, this.$container).find('.variant-input-wrap').each(function(index, el) {
          var $group = $(el);
          var currentOptionIndex = $group.data('index');
  
          if (currentOptionIndex !== optionIndex) {
            // Disable all options as a starting point
            this.disableVariantGroup($group);
  
            // Loop through legit available options and enable
            for (var i = 0; i < variants.length; i++) {
              this.enableVariantOption($group, variants[i][currentOptionIndex]);
            }
          }
        }.bind(this));
      },
  
      disableVariantGroup: function($group) {
        if (this.settings.variantType === 'dropdown') {
          $group.find('option').prop('disabled', true)
        } else {
          $group.find('input').prop('disabled', true);
          $group.find('label').toggleClass('disabled', true);
        }
      },
  
      enableVariantOptionByValue: function(array, index) {
        var $group = $(selectors.formContainer, this.$container).find('.variant-input-wrap[data-index="'+ index +'"]');
  
        for (var i = 0; i < array.length; i++) {
          this.enableVariantOption($group, array[i]);
        }
      },
  
      enableVariantOption: function($group, value) {
        // Selecting by value so escape it
        value = value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');
  
        if (this.settings.variantType === 'dropdown') {
          $group.find('option[value="'+ value +'"]').prop('disabled', false);
        } else {
          var $buttonGroup = $group.find('.variant-input[data-value="'+ value +'"]');
          $buttonGroup.find('input').prop('disabled', false);
          $buttonGroup.find('label').toggleClass('disabled', false);
        }
      },
  
      /*============================================================================
        Product images
      ==============================================================================*/
      preImageSetup: function() {
        this.setImageSizes();
        this.initImageSwitch();
        this.initImageZoom();
        this.customMediaListners();
        this.initModelViewerLibraries();
        this.initShopifyXrLaunch();
      },
  
      imageSetup: function(needStylesheet) {
        if (!this.$thumbSlider.length || $(selectors.photoThumbs, this.$container).length < 2) {
          // Single product image. Init video if it exists
          var $video = $(selectors.productImageMain, this.$container).find(selectors.productVideo);
          if ($video.length) {
            this.initVideo($video);
          }
  
          return;
        }
  
        this.settings.hasMultipleImages = true;
        this.settings.has3d = this.$container.find(selectors.media).length;
  
        if (this.settings.videoStyle !== 'muted') {
          theme.videoModal(true);
        }
  
        if (needStylesheet) {
          theme.utils.promiseStylesheet().then(function() {
            this.createImageCarousels();
          }.bind(this));
        } else {
          this.createImageCarousels();
        }
      },
  
      initImageZoom: function() {
        var $container = $(selectors.imageContainer, this.$container);
        var imageZoom = new theme.Photoswipe($container, this.sectionId);
      },
  
      getThumbIndex: function($target) {
        var $slide = $target.closest('.product__thumb-item');
        var index = $slide.index();
        index = index < 0 ? 0 : index;
        return index;
      },
  
      setImageSizes: function() {
        if (!this.settings.hasImages) {
          return;
        }
  
        // Get srcset image src, works on most modern browsers
        // otherwise defaults to settings.imageSize
        var currentImage = this.$firstProductImage[0].currentSrc;
  
        if (currentImage) {
          this.settings.imageSize = theme.Images.imageSize(currentImage);
        }
      },
  
      updateVariantImage: function(evt) {
        var variant = evt.variant;
        var sizedImgUrl = theme.Images.getSizedImageUrl(variant.featured_media.preview_image.src, this.settings.imageSize);
  
        var imageIndex = $('.product__slide[data-id="' + variant.featured_media.id + '"]').data('index');
  
        // No image, bail
        if (typeof imageIndex === 'undefined') {
          return;
        }
  
        if (!theme.config.bpSmall && this.settings.stackedImages) {
          this.stackedScrollTo(imageIndex);
        } else {
          this.$mainSlider.slick('slickGoTo', imageIndex);
        }
      },
  
      initImageSwitch: function() {
        if (!$(selectors.photoThumbs, this.$container).length) {
          return;
        }
  
        $(selectors.photoThumbs, this.$container)
          .on('click', function(evt) {
            evt.preventDefault();
            if (!theme.config.bpSmall && this.settings.stackedImages) {
              var index = this.getThumbIndex($(evt.currentTarget));
              this.stackedScrollTo(index);
            }
          }.bind(this))
          .on('focus', function(evt) {
            var index = this.getThumbIndex($(evt.currentTarget));
  
            if (!theme.config.bpSmall) {
              if (this.settings.stackedImages) {
                $(selectors.photoThumbItem, this.$container)
                  .removeClass(classes.thumbActive);
                this.stackedScrollTo(index);
              } else {
                if (this.$mainSlider && this.settings.slickMainInitialized) {
                  this.$mainSlider.slick('slickGoTo', index);
                }
              }
            }
          }.bind(this))
          .on('keydown', function(evt) {
            if (evt.keyCode === 13) {
              this.$container.find(selectors.currentSlide).focus();
            }
          }.bind(this));
      },
  
      stackedImagesInit: function() {
        $(window).off(this.namespaceImages);
        this.stackedImagePositions();
  
        if (this.inModal) {
          // Slight delay in modal to accommodate loading videos
          setTimeout(function() {
            this.stackedActive(this.settings.stackedCurrent);
          }.bind(this), 1000);
        } else {
          this.stackedActive(this.settings.stackedCurrent);
        }
  
        // update image positions on resize
        $(window).on('resize' + this.namespaceImages, $.debounce(200, this.stackedImagePositions.bind(this)));
  
        // scroll listener to mark active thumbnail
        $(window).on('scroll' + this.namespaceImages, $.throttle(200, function() {
          var goal = window.scrollY;
          var closest = this.settings.stackedImagePositions.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
          });
          var index = this.settings.stackedImagePositions.indexOf(closest);
          if (this.settings.stackedCurrent !== index) {
            this.stackedActive(index);
          }
        }.bind(this)));
      },
  
      stackedImagePositions: function() {
        var positions = [];
        $(selectors.photo, this.$container).each(function() {
          positions.push(Math.round($(this).offset().top));
        });
        this.settings.stackedImagePositions = positions;
      },
  
      stackedScrollTo: function(index) {
        // Scroll to top of large image
        var pos = $(selectors.photo, this.$container).eq(index).offset().top;
        $('html, body').animate({
          scrollTop: pos
        }, 400, 'swing');
      },
  
      stackedActive: function(index) {
        $(selectors.photoThumbItem, this.$container)
          .removeClass(classes.thumbActive)
          .eq(index).addClass(classes.thumbActive);
  
        if (this.settings.hasVideos) {
          this.stopVideo();
  
          var $video = $(selectors.photo, this.$container).eq(index).find('.product__video');
  
          if ($video.length) {
            this.initVideo($video);
          }
        }
  
        if (this.settings.has3d) {
          this.$container.find(selectors.media).trigger('mediaHidden');
  
          var $media = $(selectors.photo, this.$container).eq(index).find(selectors.media);
  
          if ($media.length) {
            $media.trigger('mediaVisible');
          }
        }
  
        this.settings.stackedCurrent = index;
      },
  
      createImageCarousels: function() {
        // Set starting slide (for both sliders)
        var $activeSlide = this.$mainSlider.find('.starting-slide');
        var startIndex = this._slideIndex($activeSlide);
  
        // Lame way to prevent duplicate event listeners
        this.$mainSlider.off('init');
        this.$mainSlider.off('beforeChange');
        this.$mainSlider.on('init', this.mainSlideInit.bind(this));
        this.$mainSlider.on('beforeChange', this.beforeSlideChange.bind(this));
        this.$thumbSlider.on('init', this.thumbSlideInit.bind(this));
  
        // Default (mobile) slider settings
        this.mainSliderArgs = {
          infinite: this.settings.has3d ? false : true,
          arrows: false,
          dots: true,
          touchThreshold: 10,
          speed: 300,
          adaptiveHeight: true,
          initialSlide: startIndex,
          rtl: theme.config.rtl,
          appendDots: this.$container.find(selectors.dotsContainer)
        };
  
        this.thumbSliderArgs = {
          accessibility: false,
          rtl: theme.config.rtl,
          initialSlide: startIndex
        };
  
        // Init sliders normally
        var sliderArgs = this.setSliderArgs();
        this.initSliders(sliderArgs);
  
        // Re-init slider when a breakpoint is hit
        $('body').on('matchSmall matchLarge', function() {
          var sliderArgs = this.setSliderArgs();
          this.initSliders(sliderArgs, true);
        }.bind(this));
  
        // Too many thumbnails can cause the AOS calculations to be off
        // so refresh that when the slider is ready
        if (AOS) {
          AOS.refresh();
        }
      },
  
      initSliders: function(args, reload) {
        this.destroyImageCarousels();
  
        if (!theme.config.bpSmall && this.settings.stackedImages) {
          this.stackedImagesInit();
        } else {
          this.$mainSlider.not('.slick-initialized').slick(args.main);
        }
  
        if (!theme.config.bpSmall && !this.settings.stackedImages) {
          if (this.$thumbSlider.length) {
            this.$thumbSlider.not('.slick-initialized').slick(args.thumbs);
          }
        }
  
        // If form is already setup, load here.
        // Also runs when breakpoints change
        if (this.variants && this.settings.imageSetName) {
          this.updateImageSet(null, reload);
        }
      },
  
      setSliderArgs: function() {
        var args = {};
        var thumbnailsVertical = this.$thumbSlider.data('position') === 'beside' ? true : false;
  
        if (theme.config.bpSmall) {
          args.main = this.mainSliderArgs;
          args.thumbs = this.thumbSliderArgs;
        } else {
          args.main = $.extend({}, this.mainSliderArgs, {
            asNavFor: '#' + this.$thumbSlider.attr('id'),
            adaptiveHeight: thumbnailsVertical ? false : true,
            dots: false,
            infinite: false,
            fade: true
          });
  
          args.thumbs = $.extend({}, this.thumbSliderArgs, {
            asNavFor: '#' + this.$mainSlider.attr('id'),
            slidesToShow: thumbnailsVertical ? 3 : 5,
            slidesToScroll: 1,
            arrows: false,
            dots: false,
            vertical: thumbnailsVertical,
            verticalSwiping: thumbnailsVertical,
            focusOnSelect: true,
            infinite: false,
            customHeightMatching: thumbnailsVertical,
            customSlideAdvancement: true
          });
        }
  
        return args;
      },
  
      destroyImageCarousels: function() {
        if (this.$mainSlider && this.settings.slickMainInitialized) {
          this.$mainSlider.slick('slickUnfilter').slick('unslick');
          this.settings.slickMainInitialized = false;
        }
  
        if (this.$thumbSlider && this.settings.slickThumbInitialized) {
          this.$thumbSlider.slick('slickUnfilter').slick('unslick');
          this.settings.slickThumbInitialized = false;
        }
  
        this.settings.slickMainInitialized = false;
        this.settings.slickThumbInitialized = false;
      },
  
      mainSlideInit: function(event, slick) {
        var $currentSlide = slick.$slider.find(selectors.currentSlide);
        var $video = $currentSlide.find(selectors.productVideo);
        var $media = $currentSlide.find(selectors.media);
  
        this.settings.slickMainInitialized = true;
  
        if ($video.length) {
          this.initVideo($video);
        }
  
        if ($media.length) {
          this.hideZoomOverlay(true);
        }
      },
  
      thumbSlideInit: function(event, slick) {
        this.settings.slickThumbInitialized = true;
      },
  
      beforeSlideChange: function(event, slick, currentSlide, nextSlide) {
        var $slider = slick.$slider;
        var $currentSlide = $slider.find(selectors.currentSlide);
        var $nextSlide = $slider.find('.slick-slide[data-slick-index="' + nextSlide + '"]');
        var hideZoomOverlay = false;
  
        // Pause any existing slide video
        var $prevVideo = $currentSlide.find('.product__video');
        if (currentSlide !== nextSlide && $prevVideo.length) {
          var prevVideoType = this.getVideoType($prevVideo);
          var prevVideoId = this.getVideoId($prevVideo);
  
          if (prevVideoId) {
            this.stopVideo(prevVideoId, prevVideoType);
          }
        }
  
        // Prep next slide video
        var $nextVideo = $nextSlide.find('.product__video');
        if ($nextVideo.length) {
          hideZoomOverlay = true;
          var type = this.getVideoType($nextVideo);
          var videoId = this.getVideoId($nextVideo);
  
          // Prep YouTube with a backup in case API isn't ready
          if (videoId && type === 'youtube') {
            if (youtubeReady) {
              if (videos[videoId] && videos[videoId].style === 'muted') {
                this.requestToPlayYoutubeVideo(videoId, true);
              }
            } else {
              $('body').on('youTubeReady' + this.namespace, function() {
                if (videos[videoId] && videos[videoId].style === 'muted') {
                  this.requestToPlayYoutubeVideo(videoId, true);
                }
              }.bind(this))
            }
          }
  
          // Autoplay muted MP4 videos
          if (videoId && videos[videoId] && videos[videoId].style === 'muted') {
            if (type === 'mp4') {
              this.playMp4Video(videoId);
            }
          }
  
          // Set unmuted videos to loaded state
          if (videoId && videos[videoId] && videos[videoId].style != 'muted') {
            setParentAsLoaded($('#' + videoId));
          }
        }
  
        // Hide zoom if next slide has video trigger button
        if ($nextSlide.find('.product-video-trigger').length) {
          hideZoomOverlay = true;
        }
  
        // Pause any existing media
        var $currentMedia = $currentSlide.find(selectors.media);
        if ($currentMedia.length) {
          $currentMedia.trigger('mediaHidden');
        }
  
        // Prep next slide media
        var $nextMedia = $nextSlide.find(selectors.media);
        if ($nextMedia.length) {
          hideZoomOverlay = true;
          $nextMedia.trigger('mediaVisible');
          $nextSlide.find('.shopify-model-viewer-ui__button').attr('tabindex', 0);
          $nextSlide.find('.product-single__close-media').attr('tabindex', 0);
        }
  
        this.hideZoomOverlay(hideZoomOverlay);
      },
  
      hideZoomOverlay: function(hide) {
        if (hide) {
          $(selectors.zoomButton, this.$container).addClass(classes.hidden);
        } else {
          $(selectors.zoomButton, this.$container).removeClass(classes.hidden);
        }
      },
  
      resizeSlides: function() {
        if (!this.settings.hasMultipleImages) {
          return;
        }
  
        // Necessary to make slider visible again
        $(window).trigger('resize.slick');
        setTimeout(function() {
          if (this.$mainSlider && this.settings.slickMainInitialized) {
            this.$mainSlider.slick('setPosition');
          }
          if (this.$thumbSlider && this.settings.slickThumbInitialized) {
            this.$thumbSlider.slick('setPosition');
          }
        }.bind(this), 500); // same timing as modal open transition
      },
  
      _slideIndex: function($el) {
        return $el.data('slick-index');
      },
  
      /*============================================================================
        Products when in quick view modal
      ==============================================================================*/
      openModalProduct: function() {
        var initialized = false;
        if (!this.settings.modalInit) {
          var url = this.$formHolder.data('url');
          var template = this.$formHolder.data('template');
  
          // If not template, product uses default product template
          // which has sections. Ajax view is a slimmed down version to
          // load only essentials
          if (!template) {
            url = url + '?view=ajax';
          }
  
          $.get(url, function(data) {
            var $template = $(data);
            var $newForm = $template.find('#AddToCartForm-' + this.sectionId);
            this.replaceModalFormHolder(this.$formHolder, $newForm);
  
            var $sectionDiv = $template.find('#ProductSections-' + this.sectionId);
            if ($sectionDiv.length) {
              this.loadProductSections($sectionDiv);
            }
  
            var $relatedDiv = $template.find('#Recommendations-' + this.sectionId);
            if ($relatedDiv.length) {
              this.loadRelatedProducts($relatedDiv);
            }
  
            var $socialDiv = $template.find('.index-section.social-section');
            if ($socialDiv.length) {
              this.loadSocialSection($socialDiv);
            }
  
            if (window.SPR) {
              SPR.initDomEls();SPR.loadBadges();
            }
  
            sections.loadSubSections(this.$modal);
  
            document.dispatchEvent(new CustomEvent('quickview:loaded', {
              detail: {
                productId: this.sectionId
              }
            }));
          }.bind(this));
  
          this.preImageSetup();
          this.loadModalContent();
          this.imageSetup(false);
          this.settings.modalInit = true;
        } else {
          initialized = true;
          if (!theme.config.bpSmall && this.settings.stackedImages) {
            this.stackedActive(0);
          }
        }
  
        document.dispatchEvent(new CustomEvent('quickview:open', {
          detail: {
            initialized: initialized,
            productId: this.sectionId
          }
        }));
  
        this.resizeSlides();
      },
  
      closeModalProduct: function() {
        this.stopVideo();
        $('body').off(this.namespace);
        $(window).off(this.namespace);
      },
  
      replaceModalFormHolder: function($holder, $form) {
        $holder.replaceWith($form);
        this.formSetup();
        if (Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
      },
  
      loadProductSections: function($content) {
        $('#ProductSectionsHolder-' + this.sectionId).replaceWith($content);
      },
  
      loadRelatedProducts: function($content) {
        // Remove any quick view modals as they cause conflicts.
        // These are not output with product.ajax templates,
        // but are in our custom product.sections ones and any custom ones
        // developers create.
        $content.find('.screen-layer--product').remove();
  
        $('#ProductRelatedHolder-' + this.sectionId).replaceWith($content);
      },
  
      loadSocialSection: function($content) {
        $('#SocialSectionHolder-' + this.sectionId).replaceWith($content);
      },
  
      loadModalContent: function() {
        // Load videos if they exist
        var videoTypes = this.checkIfVideos();
  
        // Lazyload mp4 videos
        if (videoTypes && videoTypes.indexOf('mp4') > -1) {
          this.$modal
            .find('.product__video[data-video-type="mp4"]')
            .find('.product__video-src')
            .each(function(i, video) {
              var $el = $(video);
              var src = $el.attr('src');
              var type = $el.attr('type')
              var newEl = document.createElement('source');
              newEl.src = src;
              newEl.type = type;
              $el.after(newEl);
            }.bind(this));
        }
      },
  
      /*============================================================================
        Product media (3D)
      ==============================================================================*/
      initModelViewerLibraries: function() {
        var $modelViewerElements = $(
          selectors.media,
          this.$container
        );
  
        if ($modelViewerElements.length < 1) return;
  
        theme.ProductMedia.init($modelViewerElements, this.sectionId);
      },
  
      initShopifyXrLaunch: function() {
        var self = this;
        $(document).on('shopify_xr_launch', function() {
          var $currentMedia = $(
            self.selectors.productMediaWrapper +
              ':not(.' +
              classes.hidden +
              ')',
            self.$container
          );
          $currentMedia.trigger('xrLaunch');
        });
      },
  
      customMediaListners: function() {
        $(selectors.closeMedia, this.$container).on('click', function() {
          this.$container.find(selectors.media).trigger('mediaHidden');
        }.bind(this));
  
        this.$container.find('model-viewer')
          .on('shopify_model_viewer_ui_toggle_play', function(evt) {
            this.mediaLoaded(evt);
          }.bind(this))
          .on('shopify_model_viewer_ui_toggle_pause', function(evt) {
            this.mediaUnloaded(evt);
          }.bind(this));
      },
  
      mediaLoaded: function(evt) {
        this.$container.find(selectors.closeMedia).removeClass('hide');
        this.toggleSliderSwiping(false);
      },
  
      mediaUnloaded: function(evt) {
        this.$container.find(selectors.closeMedia).addClass('hide');
        this.toggleSliderSwiping(true);
      },
  
      toggleSliderSwiping: function(enable) {
        if (this.$mainSlider && this.settings.slickMainInitialized) {
          this.$mainSlider.slick('slickSetOption', 'swipe', enable);
          this.$mainSlider.slick('slickSetOption', 'draggable', enable);
          this.$mainSlider.slick('slickSetOption', 'touchMove', enable);
          this.$mainSlider.slick('slickSetOption', 'accessibility', enable);
        }
      },
  
      onUnload: function() {
        this.$container.off(this.namespace);
        $('body').off(this.namespace);
        $(window).off(this.namespace).off(this.namespaceImages);;
        this.destroyImageCarousels();
        theme.ProductMedia.removeSectionModels(this.sectionId);
  
        for (var key in this.videos) {
          if (this.videos[key].type === 'youtube') {
            if (this.videos.hasOwnProperty(key)) {
              if (youtubePlayers[key]) {
                delete youtubePlayers[key];
              }
            }
          }
        }
  
        if (AOS) {
          AOS.refresh();
        }
      }
    });
  
    return Product;
  })();
  
  theme.Recommendations = (function() {
  
    function Recommendations(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');
      this.url = $container.data('url');
  
      this.selectors = {
        recommendations: '#Recommendations-' + sectionId,
        placeholder: '.product-recommendations-placeholder',
        sectionClass: ' .product-recommendations',
        productResults: '.grid-product'
      };
  
      this.init();
    }
  
    Recommendations.prototype = $.extend({}, Recommendations.prototype, {
      init: function() {
        var $section = $(this.selectors.recommendations);
  
        if (!$section.length || $section.data('enable') === false) {
          return;
        }
  
        var $placeholder = $section.find(this.selectors.placeholder);
        var id = $section.data('product-id');
        var limit = $section.data('limit');
  
        var url = this.url + '?section_id=product-recommendations&limit='+ limit +'&product_id=' + id;
  
        $placeholder.load(url + this.selectors.sectionClass, function(data) {
          theme.reinitProductGridItem($section);
  
          // If no results, hide the entire section
          if ($(data).find(this.selectors.sectionClass).find(this.selectors.productResults).length === 0) {
            $section.addClass('hide');
          }
        }.bind(this));
      }
    });
  
    return Recommendations;
  })();
  
  theme.StoreAvailability = (function() {
    var selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      productTitle: '[data-availability-product-title]'
    };
  
    function StoreAvailability(container) {
      this.container = container;
      this.baseUrl = container.dataset.baseUrl;
      this.productTitle = container.dataset.productName;
    }
  
    StoreAvailability.prototype = Object.assign({}, StoreAvailability.prototype, {
      updateContent: function(variantId) {
        var variantSectionUrl =
          this.baseUrl +
          '/variants/' +
          variantId +
          '/?section_id=store-availability';
  
        this.container.innerHTML = '';
  
        var self = this;
  
        fetch(variantSectionUrl)
          .then(function(response) {
            return response.text();
          })
          .then(function(storeAvailabilityHTML) {
            if (storeAvailabilityHTML.trim() === '') {
              return;
            }
  
            self.container.innerHTML = storeAvailabilityHTML;
            self.container.innerHTML = self.container.firstElementChild.innerHTML;
  
            // Move drawer content into separate div
            var drawerContents = self.container.querySelector('.drawer');
            if (!drawerContents) {
              return;
            }
            var drawerHolder = document.getElementById('AvailabilityDrawer');
            drawerHolder.innerHTML = '';
            drawerHolder.appendChild(drawerContents);
  
            // Only create drawer if have open button
            if (!self.container.querySelector(selectors.drawerOpenBtn)) {
              return;
            }
  
            var drawerId = self.container.querySelector(selectors.drawerOpenBtn).getAttribute('aria-controls');
  
            self.drawer = new theme.Drawers(drawerId, 'availability');
  
            drawerHolder.querySelector(selectors.productTitle).textContent = self.productTitle;
          });
      }
    });
  
    return StoreAvailability;
  })();
  
  // Handles multiple section interactions:
  //  - Featured collection slider
  //  - Featured collection grid (hover product sliders only)
  //  - Related products
  //  - Social reviews
  //
  // Options:
  //  - scrollable: overflow div with arrows
  //  - infinite pagination: only in slider format
  
  theme.FeaturedCollection = (function() {
    var selectors = {
      scrollWrap: '[data-pagination-wrapper]',
      productContainer: '[data-product-container]',
      collectionProductContainer: '[data-collection-container]',
      product: '[data-product-grid]',
      arrows: '[data-arrow]'
    };
  
    var classes = {
      loading: 'collection-loading',
      arrowLeft: 'overflow-scroller__arrow--left',
      disableScrollLeft: 'overflow-scroller--disable-left',
      disableScrollRight: 'overflow-scroller--disable-right'
    };
  
    function FeaturedCollection(container) {
      this.$container = $(container);
      this.sectionId = this.$container.attr('data-section-id');
      this.$scrollWrap = $(selectors.scrollWrap, this.$container);
      this.$scrollArrows = $(selectors.arrows, this.$container);
      this.namespace = '.featured-collection-' + this.sectionId;
  
      this.options = {
        scrollable: this.$container.data('scrollable'),
        paginate: this.$container.data('paginate')
      };
  
      var paginateBy = this.$container.data('paginate-by');
      var productCount = this.$container.data('collection-count');
  
      this.settings = {
        url: this.$container.data('collection-url'),
        page: 1,
        pageCount: this.options.paginate ? Math.ceil(productCount / paginateBy) : 0,
        itemsToScroll: 3,
        gridItemWidth: this.$container.data('grid-item-width')
      };
  
      this.state = {
        isInit: false,
        loading: false,
        scrollerEnabled: false,
        loadedAllProducts: false,
        scrollable: this.options.scrollable,
        scrollInterval: null,
        scrollSpeed: 3 // smaller is faster
      };
  
      this.sizing = {
        scroller: 0,
        itemWidth: 0
      };
  
      theme.utils.promiseStylesheet().then(function() {
        this.checkVisibility();
        $(window).on('scroll' + this.namespace, $.debounce(200, this.checkVisibility.bind(this)));
      }.bind(this));
    }
  
    FeaturedCollection.prototype = $.extend({}, FeaturedCollection.prototype, {
      checkVisibility: function() {
        if (this.state.isInit) {
          // If a value is 0, we need to recalculate starting points
          if (this.sizing.scrollSize === 0) {
            this.$scrollWrap.trigger('scroll' + this.namespace);
          }
          $(window).off('scroll' + this.namespace);
          return;
        }
  
        if (theme.isElementVisible(this.$container)) {
          this.init();
          this.state.isInit = true;
        }
      },
  
      init: function() {
        new theme.HoverProductGrid(this.$container);
  
        if (!this.state.scrollable) {
          return;
        }
  
        this.sizing = this.getScrollWidths();
  
        $(window).on('resize' + this.namespace, $.debounce(200, this.handleResize.bind(this)));
  
        this.toggleScrollListener(this.state.scrollable);
        this.arrowListeners(this.state.scrollable);
      },
  
      reInit: function() {
        new theme.HoverProductGrid(this.$container);
  
        if (this.state.scrollable) {
          this.sizing = this.getScrollWidths();
          this.toggleScrollListener(this.state.scrollable);
        }
  
        theme.reinitProductGridItem();
      },
  
      loadingState: function(loading) {
        this.state.loading = loading;
        this.$container.toggleClass(classes.loading, loading);
      },
  
      getScrollWidths: function() {
        var container = this.$scrollWrap.width();
        var scroller = this.$scrollWrap[0].scrollWidth;
        var itemWidth = this.$scrollWrap.find('.grid__item').first().outerWidth();
  
        // First time this runs there is a 200px CSS animation that JS doesn't
        // take into account, so manually subtract from the scroller width
        if (!this.state.isInit) {
          scroller = scroller - 200;
        }
  
        if (scroller <= container) {
          this.disableArrow(null, true);
        }
  
        return {
          scroller: scroller,
          scrollSize: scroller - container,
          itemWidth: itemWidth
        };
      },
  
      handleResize: function() {
        if (this.state.scrollable) {
          this.sizing = this.getScrollWidths();
        }
        this.toggleScrollListener(this.state.scrollable);
        this.arrowListeners(this.state.scrollable);
      },
  
      toggleScrollListener: function(enable) {
        if (enable) {
          if (this.state.scrollerEnabled) { return; }
          this.$scrollWrap.on('scroll' + this.namespace, $.throttle(250, this.scrollCheck.bind(this)));
          this.state.scrollerEnabled = true;
        } else {
          this.$scrollWrap.off('scroll' + this.namespace);
          this.state.scrollerEnabled = false;
        }
      },
  
      scrollCheck: function(evt) {
        if (this.state.loading) {
          this.toggleScrollListener(false);
          return;
        }
  
        // If a value is 0, we need to recalculate starting points
        if (this.sizing.scrollSize === 0) {
          this.sizing = this.getScrollWidths();
        }
  
        var scrollLeft = evt.currentTarget.scrollLeft ? evt.currentTarget.scrollLeft : 0;
        var percent = Math.floor(scrollLeft / this.sizing.scrollSize * 100);
        var fromEnd = this.sizing.scrollSize - scrollLeft;
  
        if (this.options.paginate) {
          if (!this.state.loadedAllProducts && percent > 50) {
            this.getNewProducts();
          }
        }
  
        if (!percent) {
          percent = 0;
        }
  
        this.disableArrow(percent);
      },
  
      arrowListeners: function(enable) {
        if (enable) {
          this.$scrollArrows
            .removeClass('hide')
            .off(this.namespace)
            .on('click' + this.namespace, this.arrowScroll.bind(this));
        } else {
          this.$scrollArrows
            .addClass('hide')
            .off(this.namespace);
        }
      },
  
      arrowScroll: function(evt) {
        var direction = $(evt.currentTarget).hasClass(classes.arrowLeft) ? 'left' : 'right';
        var iteration = theme.config.bpSmall ? 1 : 2;
  
        if (evt.type === 'mouseenter') {
          this.state.scrollInterval = setInterval(function(){
            var currentPos = this.$scrollWrap.scrollLeft();
            var newPos = direction === 'left' ? (currentPos - iteration) : (currentPos + iteration);
            this.$scrollWrap.scrollLeft(newPos);
          }.bind(this), this.state.scrollSpeed);
        } else if (evt.type === 'mouseleave') {
          clearInterval(this.state.scrollInterval);
        } else if (evt.type === 'click') {
          clearInterval(this.state.scrollInterval);
  
          var currentPos = this.$scrollWrap.scrollLeft();
          var scrollAmount = this.sizing.itemWidth * this.settings.itemsToScroll;
          var newPos = direction === 'left' ? (currentPos - scrollAmount) : (currentPos + scrollAmount);
  
          this.$scrollWrap.stop().animate({
            scrollLeft: newPos
          }, 400, 'swing');
        }
  
        if (newPos <= 0) {
          this.disableArrow(newPos);
        }
      },
  
      disableArrow: function(pos, all) {
        this.$scrollArrows
          .removeClass(classes.disableScrollRight)
          .removeClass(classes.disableScrollLeft);
  
        if (all) {
          this.$scrollArrows
            .addClass(classes.disableScrollRight)
            .addClass(classes.disableScrollLeft);
          return;
        }
  
        // Max left scroll
        if (pos <= 0) {
          this.$scrollArrows.addClass(classes.disableScrollLeft);
          return;
        }
  
        // Max right scroll
        if (pos >= 96) {
          this.$scrollArrows.addClass(classes.disableScrollRight);
          return;
        }
      },
  
      getNewProducts: function() {
        this.loadingState(true);
        var newPage = this.settings.page + 1;
        var itemWidth = this.settings.gridItemWidth;
  
        // No more pages, disable features
        if (newPage > this.settings.pageCount) {
          this.loadingState(false);
          this.state.loadedAllProducts = true;
          return;
        }
  
        var newUrl = this.settings.url + '?page=' + (newPage);
  
        $.get(newUrl, function(data) {
          var $template = $(data);
          var $newProducts = $template.find(selectors.collectionProductContainer + ' .grid-product');
  
          $newProducts.each(function() {
            $(this).addClass(itemWidth);
          });
  
          $(selectors.productContainer, this.$container).append($newProducts);
          this.ajaxSuccess();
        }.bind(this));
      },
  
      ajaxSuccess: function() {
        this.loadingState(false);
        this.settings.page = this.settings.page + 1;
        this.reInit();
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      // Only runs in the editor while a user is activating.
      // Rearranges quick shop modals to fix potentially broken layout
      onLoad: function() {
        theme.QuickShopScreens.reInit(this.$container);
      },
  
      onUnload: function() {
        $(window).off(this.namespace).trigger('resize');
        this.$scrollWrap.off(this.namespace);
        theme.QuickShopScreens.unload(this.$container);
      }
  
    });
  
    return FeaturedCollection;
  })();
  
  theme.Collection = (function() {
    var isAnimating = false;
  
    var selectors = {
      sortSelect: '#SortBy'
    };
  
    var data = {
      sortBy: 'data-default-sortby'
    };
  
    function Collection(container) {
      this.container = container;
      this.sectionId = $(container).attr('data-section-id');
      this.namespace = '.collection-' + this.sectionId;
  
      var hasHeroImage = $('.collection-hero').length;
  
      if (hasHeroImage) {
        this.checkIfNeedReload();
      } else if (theme.settings.overlayHeader) {
        theme.headerNav.disableOverlayHeader();
      }
  
      // Ajax pagination
      $(window).on('popstate', function(state) {
        if (state) {
  
          // Bail if it's a hash link
          if(location.href.indexOf(location.pathname) >= 0) {
            return true;
          }
  
          theme.CollectionAjaxFilter(location.href).then(function() {
            isAnimating = false;
          })
        }
      }.bind(this));
  
      this.init();
    }
  
    Collection.prototype = $.extend({}, Collection.prototype, {
      init: function() {
        // init is called on load and when tags are selected
        this.$container = $(this.container);
        this.sectionId = this.$container.attr('data-section-id');
  
        this.$sortSelect = $(selectors.sortSelect);
        this.$sortSelect.on('change', this.onSortChange.bind(this));
        this.defaultSort = this.getDefaultSortValue();
  
        new theme.HoverProductGrid(this.$container);
        this.initParams();
        this.sortTags();
      },
  
      initParams: function() {
        this.queryParams = {};
  
        if (location.search.length) {
          var aKeyValue;
          var aCouples = location.search.substr(1).split('&');
          for (var i = 0; i < aCouples.length; i++) {
            aKeyValue = aCouples[i].split('=');
            if (aKeyValue.length > 1) {
              this.queryParams[
                decodeURIComponent(aKeyValue[0])
              ] = decodeURIComponent(aKeyValue[1]);
            }
          }
        }
      },
  
      getSortValue: function() {
        return this.$sortSelect.val() || this.defaultSort;
      },
  
      getDefaultSortValue: function() {
        return this.$sortSelect.attr(data.sortBy);
      },
  
      onSortChange: function() {
        this.queryParams.sort_by = this.getSortValue();
  
        if (this.queryParams.page) {
          delete this.queryParams.page;
        }
  
        window.location.search = $.param(this.queryParams);
      },
  
      sortTags: function() {
        var $sortTags = $('#SortTags');
  
        if (!$sortTags.length) {
          return;
        }
  
        $sortTags.on('change', function() {
          location.href = $(this).val();
        });
      },
  
      // A liquid variable in the header needs a full page refresh
      // if the collection header hero image setting is enabled
      // and the header is set to sticky. Only necessary in the editor.
      checkIfNeedReload: function() {
        if (!Shopify.designMode) {
          return;
        }
  
        if (!theme.settings.overlayHeader) {
          return;
        }
  
        if (!$('.header-wrapper').hasClass('header-wrapper--overlay')) {
          location.reload();
        }
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      onUnload: function() {
        $(window).off(this.namespace);
        this.$container.off(this.namespace);
      }
  
    });
  
    return Collection;
  })();
  
  theme.CollectionFilter = (function() {
    var isAnimating = false;
  
    var selectors = {
      tags: '.tag a',
      activeTagList: '.tag-list--active-tags'
    };
  
    var classes = {
      activeTag: 'tag--active',
      removeTagParent: 'tag--remove'
    };
  
    function CollectionFilter(container) {
      this.$container = $(container);
      this.sectionId = this.$container.attr('data-section-id');
      this.namespace = '.collection-filter-' + this.sectionId;
  
      this.settings = {
        combineTags: this.$container.data('combine-tags')
      };
  
      this.initTagAjax();
    }
  
    CollectionFilter.prototype = $.extend({}, CollectionFilter.prototype, {
      initTagAjax: function() {
  
        $('body').on('click', selectors.tags, function(evt) {
          var $el = $(this);
  
          if ($el.hasClass('no-ajax')) {
            return;
          }
  
          evt.preventDefault();
          if (isAnimating) {
            return;
          }
  
          isAnimating = true;
  
          var $el = $(evt.currentTarget);
          var $parent = $el.parent();
          var newUrl = $el.attr('href');
  
          if (this.settings.combineTags) {
            if ($parent.hasClass(classes.activeTag)) {
              $parent.removeClass(classes.activeTag);
            } else {
              // If adding a tag, show new tag right away.
              // Otherwise, remove it before ajax finishes
              if ($parent.hasClass(classes.removeTagParent)) {
                $parent.remove();
              } else {
                $(selectors.activeTagList).append('<li class="tag tag--remove"><a class="btn btn--small js-no-transition">' + $el.text() + '</a></li>');
              }
  
              $parent.addClass(classes.activeTag);
            }
          } else {
            $(selectors.tags).parent().removeClass(classes.activeTag);
            $parent.addClass(classes.activeTag);
          }
  
          history.pushState({}, '', newUrl);
          $('.grid-product').addClass('unload');
          theme.CollectionAjaxFilter(newUrl).then(function() {
            isAnimating = false;
          });
        }.bind(this));
      }
    });
  
    return CollectionFilter;
  })();
  
  theme.CollectionAjaxFilter = function(url) {
    var selectors = {
      filterWrapper: '.collection-filter__wrapper',
      productsWrapper: '#CollectionAjaxContent'
    };
  
    url = url.indexOf('?') === -1 ? (url + '?view=ajax') : (url + '&view=ajax');
  
    var promise = $.Deferred(function(defer) {
      $.get(url, function(data) {
        var $template = $(data);
  
        // Replace filters
        var $filters = $template.find(selectors.filterWrapper);
        $(selectors.filterWrapper).replaceWith($filters);
  
        // Replace products
        var $products = $template.find(selectors.productsWrapper);
        $(selectors.productsWrapper).replaceWith($products)
  
        sections.reinitSection('collection-template');
        theme.QuickShopScreens.reInit($(selectors.productsWrapper));
        theme.reinitProductGridItem($(selectors.productsWrapper));
  
        defer.resolve();
      });
    });
  
    return promise;
  }
  
  theme.HeaderSection = (function() {
  
    function Header(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');
  
      this.initDrawers();
      theme.headerNav.init();
      theme.slideNav.init();
  
      // Reload any slideshow when the header is reloaded to make sure the
      // sticky header works as expected (it can be anywhere in the sections.instance array)
      sections.reinitSection('slideshow-section');
    }
  
    Header.prototype = $.extend({}, Header.prototype, {
      initDrawers: function() {
        if ($(document.body).hasClass('template-cart')) {
          new theme.AjaxCart('CartPage');
        } else if (theme.settings.cartType === 'drawer') {
          new theme.AjaxCart('CartDrawer');
        }
      },
  
      onUnload: function() {
        theme.headerNav.unload();
        theme.slideNav.unload();
      }
    });
  
    return Header;
  
  })();
  
  theme.FooterSection = (function() {
  
    var selectors = {
      disclosureLocale: '[data-disclosure-locale]',
      disclosureCurrency: '[data-disclosure-currency]'
    };
  
    function Footer(container) {
      var $container = this.$container = $(container);
  
      this.cache = {};
      this.cacheSelectors();
  
      if (this.cache.$localeDisclosure.length) {
        this.localeDisclosure = new theme.Disclosure(
          this.cache.$localeDisclosure
        );
      }
  
      if (this.cache.$currencyDisclosure.length) {
        this.currencyDisclosure = new theme.Disclosure(
          this.cache.$currencyDisclosure
        );
      }
    }
  
    Footer.prototype = $.extend({}, Footer.prototype, {
      cacheSelectors: function() {
        this.cache = {
          $localeDisclosure: this.$container.find(selectors.disclosureLocale),
          $currencyDisclosure: this.$container.find(selectors.disclosureCurrency)
        };
      },
  
      onUnload: function() {
        if (this.cache.$localeDisclosure.length) {
          this.localeDisclosure.unload();
        }
  
        if (this.cache.$currencyDisclosure.length) {
          this.currencyDisclosure.unload();
        }
      }
    });
  
    return Footer;
  })();
  
  theme.FeaturedContentSection = (function() {
  
    function FeaturedContent() {
      $('.rte').find('a:not(:has(img))').addClass('text-link');
    }
  
    return FeaturedContent;
  })();
  
  theme.slideshows = {};
  
  theme.SlideshowSection = (function() {
  
    function SlideshowSection(container) {
      var $container = this.$container = $(container);
      var $section = $container.parent();
      var sectionId = $container.attr('data-section-id');
      var slideshow = this.slideshow = '#Slideshow-' + sectionId;
  
      var $imageContainer = $(container).find('.hero');
      if ($imageContainer.length) {
        theme.loadImageSection($imageContainer);
      }
  
      this.init();
    }
  
    SlideshowSection.prototype = $.extend({}, SlideshowSection.prototype, {
      init: function() {
        var args = {
          arrows: $(this.slideshow).data('arrows'),
          dots: $(this.slideshow).data('dots'),
          pauseOnHover: true
        };
  
        theme.slideshows[this.slideshow] = new theme.Slideshow(this.slideshow, args);
      },
  
      forceReload: function() {
        this.onUnload();
        this.init();
      },
  
      onUnload: function() {
        theme.slideshows[this.slideshow].destroy();
        delete theme.slideshows[this.slideshow];
      },
  
      onSelect: function() {
        $(this.slideshow).slick('slickPause');
      },
  
      onDeselect: function() {
        $(this.slideshow).slick('slickPlay');
      },
  
      onBlockSelect: function(evt) {
        var $slideshow = $(this.slideshow);
  
        // Ignore the cloned version
        var $slide = $('.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)');
        var slideIndex = $slide.data('slick-index');
  
        // Go to selected slide, pause autoplay
        $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
      },
  
      onBlockDeselect: function() {
        $(this.slideshow).slick('slickPlay');
      }
    });
  
    return SlideshowSection;
  })();
  
  theme.HeroAnimated = (function() {
  
    var classes = {
      active: 'animated__slide--active',
      inactive: 'animated__slide--inactive'
    }
  
    function HeroAnimated(container) {
      var $container = this.$container = $(container);
      var $section = $container.parent();
      var sectionId = $container.attr('data-section-id');
      var imageCount = $container.data('count');
      var namespace = '.hero-animated-' + sectionId;
  
      var $imageContainer = $(container).find('.hero');
      if ($imageContainer.length) {
        theme.loadImageSection($imageContainer);
      }
      this.$allImages = $container.find('.animated__slide');
  
      this.state = {
        active: false,
        activeIndex: 0
      };
  
      if (imageCount === 1) {
        this.setFades(true);
        return;
      }
  
      this.interval;
      this.intervalSpeed = $container.data('interval');
      this.maxIndex = imageCount - 1;
  
      theme.utils.promiseStylesheet().then(function() {
        this.checkVisibility();
        $(window).on('scroll' + namespace, $.throttle(300, this.checkVisibility.bind(this)));
      }.bind(this));
    }
  
    HeroAnimated.prototype = $.extend({}, HeroAnimated.prototype, {
      checkVisibility: function() {
        if (!theme.isElementVisible(this.$container)) {
          this.state.active = false;
          clearInterval(this.interval);
          return;
        }
  
        if (this.state.active) {
          return;
        }
  
        this.initInterval();
      },
  
      initInterval: function() {
        this.state.active = true;
  
        this.setFades(true);
        this.interval = setInterval(function() {
          this.setFades();
        }.bind(this), this.intervalSpeed);
      },
  
      setFades: function(first) {
        // Get next image index
        var nextIndex = this.state.activeIndex === this.maxIndex ? 0 : this.state.activeIndex + 1;
  
        if (first) {
          nextIndex = this.state.activeIndex;
        }
  
        // Unset existing image
        if (!first) {
          this.$allImages.eq(this.state.activeIndex)
            .removeClass(classes.active)
            .addClass(classes.inactive);
        }
  
        // Set next image as active
        this.$allImages.eq(nextIndex)
          .removeClass(classes.inactive)
          .addClass(classes.active);
  
        this.state.activeIndex = nextIndex;
      },
  
      onUnload: function() {
        clearInterval(this.interval);
      }
    });
  
    return HeroAnimated;
  })();
  
  theme.VideoSection = (function() {
    var youtubeReady;
    var videos = [];
    var youtubePlayers = [];
    var youtubeVideoOptions = {
      width: 1280,
      height: 720,
      playerVars: {
        autohide: 0,
        branding: 0,
        cc_load_policy: 0,
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        quality: 'hd720',
        rel: 0,
        showinfo: 0,
        wmode: 'opaque'
      }
    };
  
    var vimeoReady = false;
    var vimeoVideoOptions = {
      byline: false,
      title: false,
      portrait: false,
      loop: true
    };
  
    var selectors = {
      videoParent: '.video-parent-section'
    };
  
    var classes = {
      loading: 'loading',
      loaded: 'loaded',
      interactable: 'video-interactable'
    };
  
    function videoSection(container) {
      var $container = this.$container = $(container);
      var sectionId = this.sectionId = $container.attr('data-section-id');
      var youtubePlayerId = this.youtubePlayerId = 'YouTubeVideo-' + this.sectionId;
      this.namespace = '.' + youtubePlayerId;
      var vimeoPlayerId = this.vimeoPlayerId = 'Vimeo-' + this.sectionId;
      var $vimeoTrigger = this.$vimeoTrigger = $('#VimeoTrigger-' + this.sectionId);
      var mp4Video = 'Mp4Video-' + this.sectionId;
  
      var $youtubeDiv = $('#' + youtubePlayerId);
      var $vimeoDiv = $('#' + vimeoPlayerId);
      var $mp4Div = $('#' + mp4Video);
  
      this.vimeoPlayer = [];
  
      if ($youtubeDiv.length) {
        this.youtubeVideoId = $youtubeDiv.data('video-id');
        this.initYoutubeVideo();
      }
  
      if ($vimeoDiv.length) {
        this.vimeoVideoId = $vimeoDiv.data('video-id');
        this.initVimeoVideo();
      }
  
      if ($mp4Div.length) {
        startMp4Playback(mp4Video).then(function() {
          // Video played as expected
          setParentAsLoaded($mp4Div);
        }).catch(function(error) {
          // Video cannot be played with autoplay, so let
          // user interact with video element itself
          $mp4Div.attr('controls', '');
          setParentAsLoaded($mp4Div);
          setVideoToBeInteractedWith($mp4Div);
        })
      }
    }
  
    function startMp4Playback(mp4Video) {
      return document.querySelector('#' + mp4Video).play();
    }
  
    function onVideoPlayerReady(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      youtubePlayers[playerId] = evt.target; // update stored player
      var player = youtubePlayers[playerId];
  
      setParentAsLoading($player);
  
      youtubePlayers[playerId].mute();
  
      // Remove from tabindex because YouTube iframes are annoying and you can focus
      // on the YouTube logo and it breaks
      $player.attr('tabindex', '-1');
  
      // Play video if in view
      theme.utils.promiseStylesheet().then(function() {
        videoVisibilityCheck(playerId);
  
        // Add out of view pausing
        $(window).on('scroll.' + playerId, {id: playerId}, $.throttle(150, videoVisibilityCheck));
      });
    }
  
    function videoVisibilityCheck(id) {
      var playerId;
  
      if (!id) {
        return;
      }
  
      if (typeof id === 'string') {
        playerId = id;
      } else {
        // Data comes in as part of the scroll event
        if (id && id.data) {
          playerId = id.data.id;
        } else {
          return;
        }
      }
  
      if (theme.isElementVisible($('#' + playerId))) {
        playVisibleVideo(playerId);
      } else {
        pauseHiddenVideo(playerId);
      }
    }
  
    function playVisibleVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].playVideo === 'function') {
        youtubePlayers[id].playVideo();
      }
    }
  
    function pauseHiddenVideo(id) {
      if (youtubePlayers[id] && typeof youtubePlayers[id].pauseVideo === 'function') {
        youtubePlayers[id].pauseVideo();
      }
    }
  
    function onVideoStateChange(evt, id) {
      var $player = $('#' + id);
      var playerId = $player.attr('id');
      var player = youtubePlayers[playerId];
  
      switch (evt.data) {
        case -1: // unstarted
          // Handle low power state on iOS by checking if
          // video is reset to unplayed after attempting to buffer
          if (videos[playerId].attemptedToPlay) {
            setParentAsLoaded($player);
            setVideoToBeInteractedWith($player);
          }
          break;
        case 0: // ended
          player.playVideo();
          break;
        case 1: // playing
          setParentAsLoaded($player);
          break;
        case 3: // buffering
          videos[playerId].attemptedToPlay = true;
          break;
      }
    }
  
    function setParentAsLoading($el) {
      $el
        .closest(selectors.videoParent)
        .addClass(classes.loading);
    }
  
    function setParentAsLoaded($el) {
      $el
        .closest(selectors.videoParent)
        .removeClass(classes.loading)
        .addClass(classes.loaded);
    }
  
    function setVideoToBeInteractedWith($el) {
      $el
        .closest(selectors.videoParent)
        .addClass(classes.interactable);
    }
  
    videoSection.prototype = $.extend({}, videoSection.prototype, {
      initYoutubeVideo: function() {
        videos[this.youtubePlayerId] = {
          id: this.youtubePlayerId,
          videoId: this.youtubeVideoId,
          type: 'youtube',
          attemptedToPlay: false,
          events: {
            onReady: function(evt) {
              onVideoPlayerReady(evt, this.youtubePlayerId);
            }.bind(this),
            onStateChange: function(evt) {
              onVideoStateChange(evt, this.youtubePlayerId);
            }.bind(this)
          }
        };
  
        if (!youtubeReady) {
          theme.LibraryLoader.load('youtubeSdk');
          $('body').on('youTubeReady' + this.namespace, this.loadYoutubeVideo.bind(this));
        } else {
          this.loadYoutubeVideo();
        }
      },
  
      loadYoutubeVideo: function() {
        var args = $.extend({}, youtubeVideoOptions, videos[this.youtubePlayerId]);
        args.playerVars.controls = 0;
        youtubePlayers[this.youtubePlayerId] = new YT.Player(this.youtubePlayerId, args);
  
        youtubeReady = true;
      },
  
      initVimeoVideo: function() {
        videos[this.vimeoPlayerId] = {
          divId: this.vimeoPlayerId,
          id: this.vimeoVideoId,
          type: 'vimeo'
        };
  
        var $player = $('#' + this.vimeoPlayerId);
        setParentAsLoading($player);
  
        // Button to play video on mobile
        this.$vimeoTrigger.on('click', + this.namespace, function(evt) {
          // $(evt.currentTarget).addClass('hide');
          this.requestToPlayVimeoVideo(this.vimeoPlayerId);
        }.bind(this));
  
        if (!vimeoReady) {
          window.loadVimeo();
          $('body').on('vimeoReady' + this.namespace, this.loadVimeoVideo.bind(this));
        } else {
          this.loadVimeoVideo();
        }
      },
  
      loadVimeoVideo: function() {
        var args = $.extend({}, vimeoVideoOptions, videos[this.vimeoPlayerId]);
        this.vimeoPlayer[this.vimeoPlayerId] = new Vimeo.Player(videos[this.vimeoPlayerId].divId, args);
  
        vimeoReady = true;
  
        // Only autoplay on larger screens
        if (!theme.config.bpSmall) {
          this.requestToPlayVimeoVideo(this.vimeoPlayerId);
        } else {
          var $player = $('#' + this.vimeoPlayerId);
          setParentAsLoaded($player);
        }
      },
  
      requestToPlayVimeoVideo: function(id) {
        // The slider may initialize and attempt to play the video before
        // the API is even ready, because it sucks.
  
        if (!vimeoReady) {
          // Wait for the trigger, then play it
          $('body').on('vimeoReady' + this.namespace, function() {
            this.playVimeoVideo(id);
          }.bind(this))
          return;
        }
  
        this.playVimeoVideo(id);
      },
  
      playVimeoVideo: function(id) {
        this.vimeoPlayer[id].play();
        this.vimeoPlayer[id].setVolume(0);
  
        var $player = $('#' + id);
        setParentAsLoaded($player);
      },
  
      onUnload: function(evt) {
        var sectionId = evt.target.id.replace('shopify-section-', '');
        var playerId = 'YouTubeVideo-' + sectionId;
        if (youtubePlayers[playerId]) {
          youtubePlayers[playerId].destroy();
        }
        $(window).off('scroll' + this.namespace);
        $('body').off('vimeoReady' + this.namespace);
      }
    });
  
    return videoSection;
  })();
  
  theme.Testimonials = (function() {
    var slideCount = 0;
    var defaults = {
      accessibility: true,
      arrows: false,
      dots: true,
      autoplay: false,
      touchThreshold: 20,
      rtl: theme.config.rtl,
      slidesToShow: 3,
      slidesToScroll: 3
    };
  
    function Testimonials(container) {
      var $container = this.$container = $(container);
      var sectionId = $container.attr('data-section-id');
      var wrapper = this.wrapper = '.testimonials-wrapper';
      var slider = this.slider = '#Testimonials-' + sectionId;
      var $slider = $(slider);
  
      this.sliderActive = false;
      var mobileOptions = $.extend({}, defaults, {
        slidesToShow: 1,
        slidesToScroll: 1,
        adaptiveHeight: true
      });
  
      slideCount = $slider.data('count');
  
      // Override slidesToShow/Scroll if there are not enough blocks
      if (slideCount < defaults.slidesToShow) {
        defaults.slidesToShow = slideCount;
        defaults.slidesToScroll = slideCount;
      }
  
      $slider.on('init', this.a11y.bind(this));
  
      if (theme.config.bpSmall) {
        this.init($slider, mobileOptions);
      } else {
        this.init($slider, defaults);
      }
  
      $('body').on('matchSmall', function() {
        this.init($slider, mobileOptions);
      }.bind(this));
  
      $('body').on('matchLarge', function() {
        this.init($slider, defaults);
      }.bind(this));
    }
  
    Testimonials.prototype = $.extend({}, Testimonials.prototype, {
      onUnload: function() {
        $(this.slider, this.wrapper).slick('unslick');
      },
  
      onBlockSelect: function(evt) {
        // Ignore the cloned version
        var $slide = $('.testimonials-slide--' + evt.detail.blockId + ':not(.slick-cloned)');
        var slideIndex = $slide.data('slick-index');
  
        // Go to selected slide, pause autoplay
        $(this.slider, this.wrapper).slick('slickGoTo', slideIndex);
      },
  
      init: function(obj, args) {
        if (this.sliderActive) {
          obj.slick('unslick');
          this.sliderActive = false;
        }
  
        obj.slick(args);
        this.sliderActive = true;
  
        if (AOS) {
          AOS.refresh();
        }
  
        $('body').on('productModalClose', function() {
          obj.slick('refresh');
        });
      },
  
      a11y: function(event, obj) {
        var $list = obj.$list;
        var $wrapper = $(this.wrapper, this.$container);
  
        // Remove default Slick aria-live attr until slider is focused
        $list.removeAttr('aria-live');
  
        // When an element in the slider is focused set aria-live
        $wrapper.on('focusin', function(evt) {
          if ($wrapper.has(evt.target).length) {
            $list.attr('aria-live', 'polite');
          }
        });
  
        // Remove aria-live
        $wrapper.on('focusout', function(evt) {
          if ($wrapper.has(evt.target).length) {
            $list.removeAttr('aria-live');
          }
        });
      }
    });
  
    return Testimonials;
  })();
  
  theme.NewsletterPopup = (function() {
    function NewsletterPopup(container) {
      var $container = this.$container = $(container);
      var sectionId = $container.attr('data-section-id');
      this.cookieName = 'newsletter-' + sectionId;
  
      if (!$container.length) {
        return;
      }
  
      // Prevent popup on Shopify robot challenge page
      if (window.location.pathname === '/challenge') {
        return;
      }
  
      this.data = {
        secondsBeforeShow: $container.data('delay-seconds'),
        daysBeforeReappear: $container.data('delay-days'),
        cookie: Cookies.get(this.cookieName),
        testMode: $container.data('test-mode')
      };
  
      this.modal = new theme.Modals('NewsletterPopup-' + sectionId, 'newsletter-popup-modal');
  
      // Open modal if errors or success message exist
      if ($container.find('.errors').length || $container.find('.note--success').length) {
        this.modal.open();
      }
  
      // Set cookie as opened if success message
      if ($container.find('.note--success').length) {
        this.closePopup(true);
        return;
      }
  
      $('body').on('modalClose.' + $container.attr('id'), this.closePopup.bind(this));
  
      if (!this.data.cookie || this.data.testMode) {
        this.initPopupDelay();
      }
    }
  
    NewsletterPopup.prototype = $.extend({}, NewsletterPopup.prototype, {
      initPopupDelay: function() {
        setTimeout(function() {
          this.modal.open();
        }.bind(this), this.data.secondsBeforeShow * 1000);
      },
  
      closePopup: function(success) {
        // Remove a cookie in case it was set in test mode
        if (this.data.testMode) {
          Cookies.remove(this.cookieName, { path: '/' });
          return;
        }
  
        var expiry = success ? 200 : this.data.daysBeforeReappear;
  
        Cookies.set(this.cookieName, 'opened', { path: '/', expires: expiry });
      },
  
      onLoad: function() {
        this.modal.open();
      },
  
      onSelect: function() {
        this.modal.open();
      },
  
      onDeselect: function() {
        this.modal.close();
      },
  
      onUnload: function() {}
    });
  
    return NewsletterPopup;
  })();
  
  theme.Maps = (function() {
    var config = {
      zoom: 14
    };
    var apiStatus = null;
    var mapsToLoad = [];
  
    var errors = {
      addressNoResults: theme.strings.addressNoResults,
      addressQueryLimit: theme.strings.addressQueryLimit,
      addressError: theme.strings.addressError,
      authError: theme.strings.authError
    };
  
    var selectors = {
      section: '[data-section-type="map"]',
      map: '[data-map]',
      mapOverlay: '[data-map-overlay]'
    };
  
    var classes = {
      mapError: 'map-section--load-error',
      errorMsg: 'map-section__error errors text-center'
    };
  
    // Global function called by Google on auth errors.
    // Show an auto error message on all map instances.
    window.gm_authFailure = function() {
      if (!Shopify.designMode) {
        return;
      }
  
      $(selectors.section).addClass(classes.mapError);
      $(selectors.map).remove();
      $(selectors.mapOverlay).after(
        '<div class="' +
          classes.errorMsg +
          '">' +
          theme.strings.authError +
          '</div>'
      );
    };
  
    function Map(container) {
      this.$container = $(container);
      this.sectionId = this.$container.attr('data-section-id');
      this.namespace = '.map-' + this.sectionId;
      this.$map = this.$container.find(selectors.map);
      this.key = this.$map.data('api-key');
  
      if (!this.key) {
        return;
      }
  
      // Lazyload API
      this.checkVisibility();
      $(window).on('scroll' + this.namespace, $.throttle(50, this.checkVisibility.bind(this)));
    }
  
    function initAllMaps() {
      // API has loaded, load all Map instances in queue
      $.each(mapsToLoad, function(index, instance) {
        instance.createMap();
      });
    }
  
    function geolocate($map) {
      var deferred = $.Deferred();
      var geocoder = new google.maps.Geocoder();
      var address = $map.data('address-setting');
  
      geocoder.geocode({ address: address }, function(results, status) {
        if (status !== google.maps.GeocoderStatus.OK) {
          deferred.reject(status);
        }
  
        deferred.resolve(results);
      });
  
      return deferred;
    }
  
    Map.prototype = $.extend({}, Map.prototype, {
      prepMapApi: function() {
        if (apiStatus === 'loaded') {
          this.createMap();
        } else {
          mapsToLoad.push(this);
  
          if (apiStatus !== 'loading') {
            apiStatus = 'loading';
            if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined' ) {
              $.getScript(
                'https://maps.googleapis.com/maps/api/js?key=' + this.key
              ).then(function() {
                apiStatus = 'loaded';
                initAllMaps();
              });
            }
          }
        }
      },
  
      createMap: function() {
        var $map = this.$map;
  
        return geolocate($map)
          .then(
            function(results) {
              var mapOptions = {
                zoom: config.zoom,
                backgroundColor: 'none',
                center: results[0].geometry.location,
                draggable: false,
                clickableIcons: false,
                scrollwheel: false,
                disableDoubleClickZoom: true,
                disableDefaultUI: true
              };
  
              var map = (this.map = new google.maps.Map($map[0], mapOptions));
              var center = (this.center = map.getCenter());
  
              var marker = new google.maps.Marker({
                map: map,
                position: map.getCenter()
              });
  
              google.maps.event.addDomListener(
                window,
                'resize',
                $.debounce(250, function() {
                  google.maps.event.trigger(map, 'resize');
                  map.setCenter(center);
                  $map.removeAttr('style');
                })
              );
            }.bind(this)
          )
          .fail(function() {
            var errorMessage;
  
            switch (status) {
              case 'ZERO_RESULTS':
                errorMessage = errors.addressNoResults;
                break;
              case 'OVER_QUERY_LIMIT':
                errorMessage = errors.addressQueryLimit;
                break;
              case 'REQUEST_DENIED':
                errorMessage = errors.authError;
                break;
              default:
                errorMessage = errors.addressError;
                break;
            }
  
            // Show errors only to merchant in the editor.
            if (Shopify.designMode) {
              $map
                .parent()
                .addClass(classes.mapError)
                .html(
                  '<div class="' +
                    classes.errorMsg +
                    '">' +
                    errorMessage +
                    '</div>'
                );
            }
          });
      },
  
      checkVisibility: function() {
        if (theme.isElementVisible(this.$container, 600)) {
          this.prepMapApi();
          $(window).off(this.namespace);
        }
      },
  
      onUnload: function() {
        if (this.$map.length === 0) {
          return;
        }
        // Causes a harmless JS error when a section without an active map is reloaded
        google.maps.event.clearListeners(this.map, 'resize');
      }
    });
  
    return Map;
  })();
  
  theme.Blog = (function() {
  
    function Blog(container) {
      this.tagFilters();
    }
  
    Blog.prototype = $.extend({}, Blog.prototype, {
      tagFilters: function() {
        var $filterBy = $('#BlogTagFilter');
  
        if (!$filterBy.length) {
          return;
        }
  
        $filterBy.on('change', function() {
          location.href = $(this).val();
        });
      },
  
      onUnload: function() {
  
      }
    });
  
    return Blog;
  })();
  
  theme.Photoswipe = (function() {
    var selectors = {
      trigger: '.product__photo-zoom',
      images: '.photoswipe__image',
      activeImage: '.slick-active .photoswipe__image'
    };
  
    function Photoswipe($container, sectionId) {
      this.$container = $container;
      this.sectionId = sectionId;
      this.namespace = '.photoswipe-' + this.sectionId;
      this.gallery;
      this.$images;
      this.inSlideshow = false;
  
      if ($container.attr('data-zoom') === 'false') {
        return;
      }
  
      if ($container.attr('data-has-slideshow') === 'true') {
        this.inSlideshow = true;
      }
  
      this.init();
    }
  
    Photoswipe.prototype = $.extend({}, Photoswipe.prototype, {
      init: function() {
        var $trigger = this.$container.find(selectors.trigger);
        this.$images = this.$container.find(selectors.images);
        var items = [];
  
        // Init gallery on active image
        $trigger.on('click' + this.namespace, function(evt) {
          items = this.getImageData();
          if (this.inSlideshow || theme.config.bpSmall) {
            var index = this.$container.find(selectors.activeImage).data('index');
          } else {
            var index = $(evt.currentTarget).data('index');
          }
          this.initGallery(items, index);
        }.bind(this));
      },
  
      getImageData: function() {
        var haveImages = false;
        var items = [];
        var options = {};
  
        this.$images.each(function() {
          var haveImages = true;
          var smallSrc = $(this).prop('currentSrc') || $(this).prop('src');
          var item = {
            msrc: smallSrc,
            src: $(this).data('photoswipe-src'),
            w: $(this).data('photoswipe-width'),
            h: $(this).data('photoswipe-height'),
            el: $(this)[0],
            initialZoomLevel: 0.5
          };
  
          items.push(item);
        });
  
        return items;
      },
  
      initGallery: function(items, index) {
        var pswpElement = document.querySelectorAll('.pswp')[0];
  
        var options = {
          allowPanToNext: false,
          captionEl: false,
          closeOnScroll: false,
          counterEl: false,
          history: false,
          index: index - 1,
          pinchToClose: false,
          preloaderEl: false,
          scaleMode: 'zoom',
          shareEl: false,
          tapToToggleControls: false,
          getThumbBoundsFn: function(index) {
            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
            var thumbnail = items[index].el;
            var rect = thumbnail.getBoundingClientRect();
            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
          }
        }
  
        this.gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
  
        this.gallery.init();
        this.gallery.listen('afterChange', this.afterChange.bind(this));
  
        // If need to destroy it
        // this.gallery.destroy();
      },
  
      afterChange: function() {
        if (this.inSlideshow) {
          var $slideshow = $('#ProductPhotos-' + this.sectionId);
          if ($slideshow.hasClass('slick-initialized')) {
            var newIndex = this.gallery.getCurrentIndex();
            $slideshow.slick('slickGoTo', newIndex);
          }
        }
      }
    });
  
    return Photoswipe;
  })();
  
  

  window.onYouTubeIframeAPIReady = function() {
    theme.config.youTubeReady = true;
    $('body').trigger('youTubeReady');
  };

  window.loadVimeo = function() {
    if (theme.config.vimeoLoading) {
      return;
    }

    if (!theme.config.vimeoReady) {
      theme.config.vimeoLoading = true;
      var tag = document.createElement('script');
      tag.src = "https://player.vimeo.com/api/player.js";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // Because there's no way to check for the Vimeo API being loaded
      // asynchronously, we use this terrible timeout to wait for it being ready
      checkIfVimeoIsReady()
        .then(function() {
          theme.config.vimeoReady = true;
          theme.config.vimeoLoading = false;
          $('body').trigger('vimeoReady');
        })
        .fail(function() {
          // No vimeo API to talk to
        });
    }
  };

  function checkIfVimeoIsReady() {
    var deferred = $.Deferred();
    var wait;
    var timeout;

    wait = setInterval(function() {
      if (!Vimeo) {
        return;
      }

      clearInterval(wait);
      clearTimeout(timeout);
      deferred.resolve();
    }, 500);

    timeout = setTimeout(function() {
      clearInterval(wait);
      deferred.reject();
    }, 4000); // subjective. test up to 8 times over 4 seconds

    return deferred;
  };

  theme.init = function() {
    theme.setGlobals();
    theme.pageTransitions();
    theme.QuickShopScreens.init();
    theme.articleImages.init();
    theme.collapsibles.init();
    if (theme.settings.cartType === 'sticky') {
      new theme.StickyCart.init();
    }
    theme.customerTemplates.init();
    theme.videoModal();
    theme.rte.init();

    $(document.documentElement).on('keyup.tab', function(evt) {
      if (evt.keyCode === 9) {
        $(document.documentElement).addClass('tab-outline');
        $(document.documentElement).off('keyup.tab');
      }
    });

    // Two ways to determine if page was loaded from cache from back button
    // Most use `pageshow` + evt.persisted, Chrome uses `performance.navigation.type`
    window.addEventListener('pageshow', function(evt) {
      if (evt.persisted) {
        theme.refreshCart();
      }
    });

    if (performance && performance.navigation.type === 2) {
      theme.refreshCart();
    }
  };

  theme.refreshCart = function() {
    if (theme.settings.cartType === 'sticky' && theme.StickyCart) {
      $.getJSON('/cart.js').then(function(cart) {
        theme.StickyCart.refresh(cart);
      })
    }
  };

  theme.setGlobals = function() {
    theme.config.hasSessionStorage = theme.isSessionStorageSupported();

    if (theme.config.isTouch) {
      $('body').addClass('supports-touch');
    }

    enquire.register(theme.config.mediaQuerySmall, {
      match: function() {
        theme.config.bpSmall = true;
        $('body').trigger('matchSmall');
      },
      unmatch: function() {
        theme.config.bpSmall = false;
        $('body').trigger('unmatchSmall');
      }
    });

    enquire.register(theme.config.mediaQuerySmallUp, {
      match: function() {
        $('body').trigger('matchLarge');
      },
      unmatch: function() {
        $('body').trigger('unmatchLarge');
      }
    });
  };

  theme.loadImageSection = function($container) {
    // Wait until images inside container have lazyloaded class
    function setAsLoaded() {
      $container.removeClass('loading').addClass('loaded');
    }

    function checkForLazyloadedImage() {
      return $container.find('.lazyloaded').length;
    }

    // If it has SVGs it's in the onboarding state so set as loaded
    if ($container.find('svg').length) {
      setAsLoaded();
      return;
    };

    if (checkForLazyloadedImage() > 0) {
      setAsLoaded();
      return;
    }

    var interval = setInterval(function() {
      if (checkForLazyloadedImage() > 0) {
        clearInterval(interval);
        setAsLoaded();
      }
    }, 80);
  }

  theme.isSessionStorageSupported = function() {
    // Return false if we are in an iframe without access to sessionStorage
    if (window.self !== window.top) {
      return false;
    }

    var testKey = 'test';
    var storage = window.sessionStorage;
    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  theme.isElementVisible = function($el, threshold) {
    var rect = $el[0].getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    threshold = threshold ? threshold : 0;

    // If offsetParent is null, it means the element is entirely hidden
    if ($el[0].offsetParent === null) {
      return false;
    }

    return (
      rect.bottom >= (0 - (threshold / 1.5)) &&
      rect.right >= 0 &&
      rect.top <= (windowHeight + threshold) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  theme.pageTransitions = function() {
    if ($('body').data('transitions') == true) {

      // Hack test to fix Safari page cache issue.
      // window.onpageshow doesn't always run when navigating
      // back to the page, so the unloading class remains, leaving
      // a white page. Setting a timeout to remove that class when leaving
      // the page actually finishes running when they come back.
      if (theme.config.isSafari) {
        $('a').on('click', function() {
          window.setTimeout(function() {
            $('body').removeClass('unloading');
          }, 1200);
        });
      }

      // Add disable transition class to malito, anchor, and YouTube links
      $('a[href^="mailto:"], a[href^="#"], a[target="_blank"], a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[download]').each(function() {
        $(this).addClass('js-no-transition');
      });

      $('a:not(.js-no-transition)').on('click', function(evt) {
        if (evt.metaKey) return true;

        var src = $(this).attr('href');

        // Bail if it's a hash link
        if(src.indexOf(location.pathname) >= 0 && src.indexOf('#') >= 0) {
          return true;
        }

        evt.preventDefault();
        $('body').addClass('unloading');
        window.setTimeout(function() {
          location.href = src;
        }, 50);
      });
    }
  };

  window.onpageshow = function(evt) {
    // Removes unload class when returning to cached page
    if (evt.persisted) {
      $('body').removeClass('unloading');
      $('.cart__checkout').removeClass('btn--loading');
      $('#StickySubmit').removeClass('btn--loading');
    }

    // Reset scroll position when coming from back button
    var historyPage = event.persisted || (typeof window.performance != 'undefined' && window.performance.navigation && window.performance.navigation.type === 2);
    if (historyPage) {
      theme.resetScrollPosition();
    }
  };

  theme.initSecondary = function() {
    document.body.classList.add('js-animate');
    AOS.init({
      easing: 'ease-out-quad',
      once: false,
      mirror: true,
      offset: 100,
      disableMutationObserver: true
    });

    document.addEventListener('lazyloaded', function(evt) {
      var $img = $(evt.target);
      if ($img.length) {
        $img.parent().addClass('loaded');
      }
    });

    document.dispatchEvent(new CustomEvent('page:loaded'));

    theme.storeScrollPositionOnUnload();
    theme.reviewAppLinkListener();
    theme.checkForAnchorLink();
  };

  theme.storeScrollPositionOnUnload = function() {
    if (!theme.config.hasSessionStorage) { return; }
    var eventName = theme.config.isSafari ? 'pagehide' : 'beforeunload';

    window.addEventListener(eventName, function (event) {
      var pos = $(document).scrollTop();

      sessionStorage.setItem('scrollPosition_' + document.location.pathname, pos.toString());
    });
  };

  theme.resetScrollPosition = function() {
    if (!theme.config.hasSessionStorage) { return; }
    var pathName = document.location.pathname;

    if (sessionStorage['scrollPosition_' + pathName]) {
      $(document).scrollTop(sessionStorage.getItem('scrollPosition_' + pathName));
    }
  };

  theme.reviewAppLinkListener = function() {
    $('body').on('click', '.spr-pagination', function() {
      var $scroller = $(this).closest('.spr-reviews').scrollLeft(0);
    });
  };

  theme.checkForAnchorLink = function() {
    if(window.location.hash) {
      var el = document.querySelector(window.location.hash);
      if (el) {
        window.scrollTo(0, el.offsetTop - 100);
      }
    }
  };

  theme.reinitProductGridItem = function() {
    if (AOS) {
      AOS.refreshHard();
    }

    // Refresh reviews app
    if (window.SPR) {
      SPR.initDomEls();SPR.loadBadges();
    }

    // Re-hook up collapsible box triggers
    theme.collapsibles.init();
  };

  $(document).ready(function() {
    theme.init();

    // Init CSS-dependent scripts
    theme.utils.promiseStylesheet().then(function() {
      theme.initSecondary();
    });

    window.sections = new theme.Sections();
    sections.register('header-section', theme.HeaderSection);
    sections.register('slideshow-section', theme.SlideshowSection);
    sections.register('hero-animated', theme.HeroAnimated);
    sections.register('video-section', theme.VideoSection);
    sections.register('product', theme.Product);
    sections.register('product-recommendations', theme.Recommendations);
    sections.register('product-template', theme.Product);
    sections.register('featured-collection', theme.FeaturedCollection);
    sections.register('collection-template', theme.Collection);
    sections.register('collection-filter', theme.CollectionFilter);
    sections.register('featured-content-section', theme.FeaturedContentSection);
    sections.register('testimonials', theme.Testimonials);
    sections.register('newsletter-popup', theme.NewsletterPopup);
    sections.register('map', theme.Maps);
    sections.register('blog', theme.Blog);
    sections.register('footer-section', theme.FooterSection);
  });

})(theme.jQuery);

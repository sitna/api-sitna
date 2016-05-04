/*
Name: autoComplete
Author: Raymond Camden & Andy Matthews
Contributors: Jim Pease (@jmpease)
Website: http://raymondcamden.com/
http://andyMatthews.net
Packed With: http://jsutility.pjoneil.net/
Version: 1.4
Modificado por Fernando Lacunza
*/

(function ($) {

    "use strict";

    var autocomplete = {
        defaults: {
            method: 'GET',
            cancelRequests: false,
            target: $(),
            source: null,
            callback: null,
            link: null,
            minLength: 0,
            matchFromStart: true
        },
        openXHR: {},
        cache: {}
    },
	buildItems = function ($this, data, settings) {
	    var html = [];
	    if (data)
	    {
	        if (settings.buildHTML)
	        {
	            $(settings.target).html(settings.buildHTML({ results: data }));
	        }
	        else
	        {
	            for (var i = 0; i < data.length; i++)
	            {
	                var elm = data[i];
	                // are we working with objects or strings?
	                if ($.isPlainObject(elm))
	                {
	                    html[html.length] = '<li><a href="' + settings.link + encodeURIComponent(elm.id) + '">' + elm.label + '</a></li>';
	                } else
	                {
	                    html[html.length] = '<li><a href="' + settings.link + encodeURIComponent(elm) + '">' + elm + '</a></li>';
	                }
	            }
	            $(settings.target).html(html.join(''));
	        }
	        
	    }
	    

	    // is there a callback?
	    if (settings.callback !== null && $.isFunction(settings.callback)) {
	        attachCallback(settings);
	    }

	    if ($this.val().length > 0) {
	        $this.trigger("targetUpdated.autocomplete");
	    } else {
	        $this.trigger("targetCleared.autocomplete");
	    }
	},
	attachCallback = function (settings) {
	    $('li a', $(settings.target)).on('click.autocomplete', function (e) {
	        e.stopPropagation();
	        e.preventDefault();
	        settings.callback(e);
	    });
	},
	clearTarget = function ($this, $target) {
	    $target.html('').closest("fieldset").removeClass("ui-search-active");
	    $this.trigger("targetCleared.autocomplete");
	},
	handleInput = function (e) {
	    var $this = $(this),
			id = $this.attr("id"),
			text,
			data,
			autocomplete = $this.data("autocomplete"),
			element_text,
			re;
	    if (autocomplete) {
	        var settings = autocomplete.settings;
	        var openXHR = autocomplete.openXHR;
	        // get the current text of the input field
	        text = $this.val();
	        // if we don't have enough text zero out the target
	        if (text.length < settings.minLength) {
	            clearTarget($this, $(settings.target));
	        } else {
	            // are we looking at a source array or remote data?
	            if ($.isArray(settings.source)) {
	                data = settings.source.sort().filter(function (element) {
	                    // matching from start, or anywhere in the string?
	                    if (settings.matchFromStart) {
	                        // from start
	                        element_text, re = new RegExp('^' + text, 'i');
	                    } else {
	                        // anywhere
	                        element_text, re = new RegExp(text, 'i');
	                    }
	                    if ($.isPlainObject(element)) {
	                        element_text = element.label;
	                    } else {
	                        element_text = element;
	                    }
	                    return re.test(element_text);
	                });
	                buildItems($this, data, settings);
	            }
	                // Accept a function as source.
	                // Function needs to call the callback, which is the first parameter.
	                // source:function(text,callback) { mydata = [1,2]; callback(mydata); }
	            else if (typeof settings.source === 'function') {

	                settings.source(text, function (data) {
	                    buildItems($this, data, settings);
	                });

	            } else {
	                $.ajax({
	                    type: settings.method,
	                    url: settings.source,
	                    data: { term: text },
	                    beforeSend: function (jqXHR) {
	                        if (settings.cancelRequests) {
	                            if (openXHR[id]) {
	                                // If we have an open XML HTTP Request for this autoComplete ID, abort it
	                                openXHR[id].abort();
	                            } else {
	                                // Set a loading indicator as a temporary stop-gap to the response time issue
	                                settings.target.html('<li><a href="#">Searching...</a></li>');
	                                settings.target.closest("fieldset").addClass("ui-search-active");
	                            }
	                            // Set this request to the open XML HTTP Request list for this ID
	                            openXHR[id] = jqXHR;
	                        }
	                    },
	                    success: function (data) {
	                        buildItems($this, data, settings);
	                    },
	                    complete: function (jqXHR, textStatus) {
	                        // Clear this ID's open XML HTTP Request from the list
	                        if (settings.cancelRequests) {
	                            openXHR[id] = null;
	                        }
	                    },
	                    dataType: 'json'
	                });
	            }
	        }
	    }
	},
	methods = {
	    init: function (options) {
	        var el = this;
	        var autocomplete = { settings: null};
	        autocomplete.settings = $.extend({}, autocomplete.defaults, options);

	        el.data("autocomplete", autocomplete);
	        var settings = autocomplete.settings;
	        return el.off("keyup.autocomplete")
						.on("keyup.autocomplete", handleInput)
						.next('.ui-input-clear')
						.on('click', function (e) {
						    clearTarget(el, $(settings.target));
						});
	    },
	    // Allow dynamic update of source and link
	    update: function (options) {
	        var autocomplete = this.data("autocomplete");
	        if (autocomplete) {
	            autocomplete.settings = $.extend(autocomplete.settings, options);
	            this.data("autocomplete", autocomplete);
	        }
	        return this;
	    },
	    // Method to forcibly clear our target
	    clear: function () {
	        var autocomplete = this.data("autocomplete");
	        if (autocomplete) {
	            clearTarget(this, $(autocomplete.settings.target));
	        }
	        return this;
	    },
	    // Method to destroy (cleanup) plugin
	    destroy: function () {
	        var autocomplete = this.data("autocomplete");
	        if (autocomplete) {
	            clearTarget(this, $(autocomplete.settings.target));
	            this.removeData("autocomplete");
	            this.off(".autocomplete");
	        }
	        return this;
	    }
	};

    $.fn.autocomplete = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }
    };

})(jQuery);

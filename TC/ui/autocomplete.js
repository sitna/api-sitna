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

var TC = TC || {};
TC.UI = TC.UI || {};

(function() {    

    var isPlainObject = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    };

    var isFunction = function(fn) {
        return typeof fn == 'function';
    };

    var extend = function() {
        // Variables
        var extended = {};
        var deep = false;
        var i = 0;

        // Check if a deep merge
        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    // If property is an object, merge properties
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = extend(extended[prop], obj[prop]);
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for (; i < arguments.length; i++) {
            merge(arguments[i]);
        }

        return extended;

    };    

    var autocomplete = {
        defaults: {
            method: 'GET',
            cancelRequests: false,
            target: null,
            source: null,
            callback: null,
            link: null,
            minLength: 0,
            matchFromStart: true
        },
        openXHR: {},
        cache: {}
    },
        
        buildItems = function(inputText, data, settings) {
            var html = [];
            if (data) {
                if (settings.buildHTML) {

                    settings.target.innerHTML = settings.buildHTML({ results: data });

                    //var template = document.createElement('template');
                    //template.innerHTML = settings.buildHTML({ results: data });

                    //(template.content ? template.content : template).childNodes.forEach(function(childNode) {
                    //    settings.target.appendChild(childNode);
                    //});                    
                }
                else {
                    for (var i = 0; i < data.length; i++) {
                        var elm = data[i];
                        // are we working with objects or strings?
                        if (isPlainObject(elm)) {
                            html.push(`<li><a href="${settings.link}${encodeURIComponent(elm.id)}">${elm.label}</a></li>`);
                        } else {
                            html.push(`<li><a href="${settings.link}${encodeURIComponent(elm)}">${elm}</a></li>`);
                        }
                    }

                    var template = document.createElement('template');
                    template.innerHTML = html.join('');

                    settings.target.appendChild(template.content ? template.content.firstChild : template.firstChild);
                }

            }


            // is there a callback?
            if (settings.callback !== null && isFunction(settings.callback)) {
                attachCallback(settings);
            }

            if (inputText.value.length > 0) {
                inputText.dispatchEvent(new CustomEvent("targetUpdated.autocomplete"));
            } else {
                inputText.dispatchEvent(new CustomEvent("targetCleared.autocomplete"));
            }
        },
        attachCallback = function(settings) {
            settings.target.querySelectorAll('li a').forEach(function(element) {
                element.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    settings.callback(e);
                });
            });

            //$('li a', $(settings.target)).on('click.autocomplete', function(e) {
            //    e.stopPropagation();
            //    e.preventDefault();
            //    settings.callback(e);
            //});
        },
        clearTarget = function(inputText, target) {
            //$target.html('').closest("fieldset").removeClass("ui-search-active");
            target.innerHTML = '';

            /* provisional el tema del fieldset */
            //document.querySelector("fieldset.ui-search-active").classList.remove("ui-search-active");

            inputText.dispatchEvent(new CustomEvent("targetCleared.autocomplete"));
        },
        handleInput = function(e) {
            var inputText = e.target,
                id = inputText.getAttribute("id"),
                text,
                data,
                autocomplete = inputText.getAttribute("autocomplete"),
                element_text,
                re;
            if (autocomplete) {
                var settings = this.settings;
                var openXHR = autocomplete.openXHR;
                // get the current text of the input field
                text = inputText.value;
                // if we don't have enough text zero out the target
                if (text.length < settings.minLength) {
                    clearTarget(inputText, settings.target);
                } else {
                    // are we looking at a source array or remote data?
                    if (Array.isArray(settings.source)) {
                        data = settings.source.sort().filter(function(element) {
                            // matching from start, or anywhere in the string?
                            if (settings.matchFromStart) {
                                // from start
                                element_text, re = new RegExp('^' + text, 'i');
                            } else {
                                // anywhere
                                element_text, re = new RegExp(text, 'i');
                            }
                            if (isPlainObject(element)) {
                                element_text = element.label;
                            } else {
                                element_text = element;
                            }
                            return re.test(element_text);
                        });
                        buildItems(inputText, data, settings);
                    }
                    // Accept a function as source.
                    // Function needs to call the callback, which is the first parameter.
                    // source:function(text,callback) { mydata = [1,2]; callback(mydata); }
                    else if (typeof settings.source === 'function') {
                        if (arguments && arguments[0]) {
                            if ([37, 39].indexOf(arguments[0].keyCode) > -1) {
                                return;
                            }
                        }

                        settings.source(text, function(data) {
                            buildItems(inputText, data, settings);
                        });

                    } else {

                        const beforeSend = function(jqXHR) {
                            if (settings.cancelRequests) {
                                if (openXHR[id]) {
                                    // If we have an open XML HTTP Request for this autoComplete ID, abort it
                                    openXHR[id].abort();
                                } else {
                                    // Set a loading indicator as a temporary stop-gap to the response time issue
                                    settings.target.innerHTML = '<li><a href="#">Searching...</a></li>';

                                    /* pendiente */
                                    //settings.target.closest("fieldset").addClass("ui-search-active");
                                }
                                // Set this request to the open XML HTTP Request list for this ID
                                openXHR[id] = jqXHR;
                            }
                        };

                        const complete = function() {
                            // Clear this ID's open XML HTTP Request from the list
                            if (settings.cancelRequests) {
                                openXHR[id] = null;
                            }
                        };

                        var xhr = new XMLHttpRequest();
                        xhr.overrideMimeType("application/json");
                        xhr.open('GET', url, true);
                        xhr.onload = function() {
                            complete();
                            var jsonResponse = JSON.parse(req.responseText);
                            buildItems(inputText, jsonResponse, settings);
                        };
                        xhr.onerror = function(error) {
                            complete();
                        };
                        beforeSend(xhr);
                        xhr.send(null);                        
                    }
                }
            }
        },
        methods = {
            init: function(options) {
                var el = this;
                var autocomplete = { settings: null };
                autocomplete.settings = extend({}, autocomplete.defaults, options);                

                el.setAttribute("autocomplete", true);

                var settings = autocomplete.settings;

                el.removeEventListener("keyup", handleInput);
                el.addEventListener("keyup", handleInput);

                if (el.parentNode.querySelector('.ui-input-clear')) {
                    el.parentNode.querySelector('.ui-input-clear').addEventListener('click', function(e) {
                        clearTarget(el, settings.target);
                    });
                }

                return el;                
            },
            // Allow dynamic update of source and link
            update: function(initialOptions, newOptions) {
                var autocomplete = this.getAttribute("autocomplete");
                if (autocomplete) {
                    this.settings = extend(this.settings, newOptions);                    
                }
                return this;
            },
            // Method to forcibly clear our target
            clear: function(options) {
                var autocomplete = this.getAttribute("autocomplete");
                if (autocomplete) {
                    clearTarget(this, this.settings.target);
                }
                return this;
            },
            // Method to destroy (cleanup) plugin
            destroy: function() {
                var autocomplete = this.getAttribute("autocomplete");
                if (autocomplete) {
                    clearTarget(this, this.settings.target);
                    this.removeAttribute("autocomplete");
                    this.removeEventListener("keyup", handleInput);
                    //this.removeEventListener(".autocomplete");
                }
                return this;
            }
        };  

    TC.UI.autocomplete = function (method) {    
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            this.settings = arguments[0];
            return methods.init.apply(this, arguments);
        }
    };

})(TC);

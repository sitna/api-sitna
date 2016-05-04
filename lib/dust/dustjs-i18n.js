/*! dustjs-i18n - v0.0.2 - 2015-03-31
* https://bitbucket.org/manolakis/dustjs-i18n
* Copyright (c) 2015 Manuel Martin; Licensed MIT */
(function (root, factory) { /* istanbul ignore if  */
	if (typeof define === "function" && define.amd) {
		// AMD. Register as an anonymous module.
		define(["dustjs-linkedin"], function (dust) {
			return factory(dust, root);
		}); /* istanbul ignore else */
	} else if (typeof module === "object" && module.exports) {
		// Node, or CommonJS-Like environments
		module.exports = factory(require("dustjs-linkedin"), this);
	} else {
		// Browser globals
		root.dust = factory(root.dust, root);
	}
}(this, function (dust, global, undefined) {
	'use strict';

		/* Utility functions */
	var toString = Object.prototype.toString,
		_console = (typeof console !== undefined) ? console : {
			log: function(){ /* a noop */}
		},
		_ = {
			isArray : Array.isArray || function(obj) {
				return toString.call(obj) === '[object Array]';
			},
			isAvailable : function(language) {
				return i18nLanguages[language] !== undefined;
			},
			log: _console.log
		},
		i18nContext = {
			selected: undefined,
			languages: {},
			filters: {}
		},
		i18nLanguages = i18nContext.languages;

	// set String trim if undefined
	if (typeof String.prototype.trim === undefined) {
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g, '');
		};	
	}

	dust.i18n = {
		/* Clears all config and loaded keys */
		resetContext: function() {
			i18nContext.selected = undefined;
			Object.keys(i18nLanguages).forEach(function(language){
				delete i18nLanguages[language];
			});
		},

		/* Set the current language. Selected language must be setted previously with setLanguages  */
		setLanguage: function(language) {
			if (_.isAvailable(language)) {
				i18nContext.selected = language;
			} else {
				throw new Error("language '" + language + "' not available!");
			}
		},

		/* Set the available languages */
		setLanguages: function(languages) {
			if (_.isArray(languages)) {
				languages.forEach(function(language){
					if (!_.isAvailable(language)) {
						i18nLanguages[language] = {};
					}
					if (i18nContext.selected === undefined) {
						i18nContext.selected = language;
					}
				});
			}
		},

		/* Be careful. If language is not setted as available then it fails silently */
		add: function(language, context) {
			if (_.isAvailable(language)){
				var languageItems = i18nLanguages[language];
				Object.keys(context).forEach(function(key){
					languageItems[key] = context[key];
				});
			}
		},

		/* Add a new filter. If name exists it won't override it */
		addFilter: function(name, filter) {
			if (!(name in i18nContext.filters)) {
				i18nContext.filters[name] = filter;
			}
		}
	};

	dust.helpers.i18n = function(chunk, context, bodies, params){
		if (params && params.$key !== undefined) {
			var selected = i18nContext.selected,
				languageItems = i18nLanguages[selected],
				pattern = /\{(\s*[\w]+\s*)\}/g,
				paramsArray, param, paramName,
				$key, $data;

			
			$key = dust.helpers.tap(params.$key, chunk, context).split('|');
            var keyName = dust.helpers.tap($key.shift(), chunk, context);
            if (languageItems !== undefined &&  languageItems[keyName] !== undefined) {
                $data = languageItems[keyName];
            }
            else {
                $data = null;
            }

			while ((paramsArray = pattern.exec($data)) !== null) {
				paramName = paramsArray[1].trim();

				if (paramName === '$key') {
					param = '';
					_.log( "$key can't be used as a parameter" );
				} else {
					param = dust.helpers.tap(params[paramsArray[1].trim()], chunk, context);	
				}
				
				$data = $data.replace(paramsArray[0], param);
			}

			$key.forEach(function(filterName){
				if (filterName in i18nContext.filters) {
					$data = i18nContext.filters[filterName]($data);
				}
			});

			chunk.write($data);
		} else {
			_.log( "No key given in the i18n helper" );
		}

		return chunk;
	};

	return dust;
}));

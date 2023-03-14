import WebComponentControl from './WebComponentControl';
import Consts from '../Consts';
import Util from '../Util';
import TC from '../../TC';

const optionElementName = 'sitna-language-option';

class LanguageOption extends HTMLElement {
    #link;

    constructor(options) {
        super();

        const self = this;
        self.CLASS = 'tc-ctl-lang-link';
        self.#link = document.createElement('a');
        self.#link.classList.add(self.CLASS);
        self.appendChild(self.#link);

        if (options) {
            self.fullCode = options.fullCode;
            self.shortCode = options.shortCode;
            self.description = options.description;
        }
    }

    connectedCallback() {
        const self = this;
        self.fullCode = self.fullCode;
        self.shortCode = self.shortCode;
        self.description = self.description;
    }

    static get observedAttributes() {
        return ['full-code', 'short-code', 'description', 'href'];
    }

    get fullCode() {
        return this.getAttribute('full-code');
    }

    set fullCode(value) {
        const self = this;
        self.setAttribute('full-code', value);
    }

    get shortCode() {
        return this.getAttribute('short-code');
    }

    set shortCode(value) {
        const self = this;
        self.setAttribute('short-code', value);
        self.#link.dataset.langCode = value;
        let parent = self;
        do {
            parent = parent.parentElement;
        }
        while (parent && !(parent instanceof LanguageSelector));
        self.#link.href = parent?.getUrl(value);
        self.#link.innerHTML = value;
    }

    get description() {
        return this.getAttribute('description');
    }

    set description(value) {
        const self = this;
        self.setAttribute('description', value);
        self.#link.setAttribute('title', value);
    }

    get href() {
        return this.#link.getAttribute('href');
    }

    set href(value) {
        this.#link.setAttribute('href', value);
    }
}

customElements.get(optionElementName) || customElements.define(optionElementName, LanguageOption);

const controlElementName = 'sitna-language-select'

class LanguageSelector extends WebComponentControl {
    static PARAMETER_NAME = "lang";
    static COOKIE_NAME = 'SITNA.language';
    static #currentLocale;

    constructor() {
        super(...arguments);

        const self = this;
        self.template = {};
        self.template[self.CLASS] = TC.apiLocation + "TC/templates/tc-ctl-lang-select.hbs";
        self.languages = [];
        if (self.options.static) {
            self.static = true;
        }
        self.tagAttributeName = self.options.tagAttributeName || 'data-sitna-i18n';
   }

    connectedCallback() {
        const self = this;
        super.connectedCallback();
        self.languages = Array.from(self.querySelectorAll('sitna-language-option'));

        if (!self.languages.length) {
            const languageOptions = self.options.languages || [
                {
                    fullCode: 'es-ES',
                    shortCode: 'es',
                    description: 'Ver en castellano'
                },
                {
                    fullCode: 'eu-ES',
                    shortCode: 'eu',
                    description: 'Euskaraz ikusi'
                },
                {
                    fullCode: 'en-US',
                    shortCode: 'en',
                    description: 'View in English'
                }
            ];
            self.languages = languageOptions.map(languageOptions => new LanguageOption(languageOptions));
            self.render();
        }
        self.static = self.static;
        if (!self.static) {
            self.collapsed = self.collapsed || true;
        }
        const languages = Array.from(self.querySelectorAll('sitna-language-option'));
        if (languages.length) {
            self.languages = languages;
        }
    }

    static get observedAttributes() {
        return ['static', 'collapsed'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        const self = this;
        if (name === 'static') {
            self.static = self.hasAttribute(name);
        }
        if (name === 'collapsed') {
            self.collapsed = self.hasAttribute(name);
        }
    }

    getClassName() {
        return 'tc-ctl-lang-select';
    }

    get static() {
        return this.hasAttribute('static');
    }

    set static(value) {
        const self = this;
        if (value) {
            self.setAttribute('static', '');
        }
        else {
            self.removeAttribute('static');
        }
    }

    get collapsed() {
        return this.hasAttribute('collapsed');
    }

    set collapsed(value) {
        const self = this;
        if (value) {
            self.setAttribute('collapsed', '');
        }
        else {
            self.removeAttribute('collapsed');
        }
    }

    register(map) {
        const self = this;
        const result = super.register.call(self, map);
        map.ready(() => LanguageSelector.setDocumentTexts());
        return result;
    }

    render() {
        const self = this;
        return self._set1stRenderPromise(new Promise(function (resolve, _reject) {
            self.renderData({ languages: self.languages }, function () {
                const linkContainer = self.querySelector(`.${self.CLASS}-links`);
                let activeLink;
                self.languages.forEach(language => {
                    linkContainer.appendChild(language);
                    const link = language.querySelector(`a.${language.CLASS}`);
                    link.addEventListener(Consts.event.CLICK, function (e) {
                        e.preventDefault();
                        self.setLanguage(e.target.dataset.langCode);
                    });
                    if (LanguageSelector.currentLocale === language.fullCode) {
                        activeLink = link;
                    }
                });
                activeLink ??= self.languages[0]?.querySelector(`a.${language.CLASS}`);
                activeLink?.classList.add(Consts.classes.ACTIVE);
                self.toggle = self.querySelector(`.${self.CLASS}-toggle`);

                self.toggle.addEventListener(Consts.event.CLICK, function (_e) {
                    self.collapsed = !self.collapsed;
                });

                resolve(self);
            });
        }));
    }

    getUrl(code) {
        return Util.addURLParameters(window.location.href, {
            [LanguageSelector.PARAMETER_NAME]: code
        });
    }

    setLanguage(code) {
        const self = this;
        const links = self.languages.map(language => language.querySelector(`a.${language.CLASS}`));
        links.forEach(link => link.classList.remove(Consts.classes.ACTIVE));
        links.find(link => link.dataset.langCode === code)?.classList.add(Consts.classes.ACTIVE);
        window.location.href = self.getUrl(code);
    }

    static setDocumentTexts() {
        document.querySelectorAll(`[${self.tagAttributeName}]`).forEach(function (elm) {
            let html = elm.innerHTML;
            const braces = html.match(/\{\{([^\{\}]+)\}\}/g);
            if (braces) {
                for (var i = 0, len = braces.length; i < len; i++) {
                    const b = braces[i];
                    const key = b.match(/[^\{\}]+/)[0];
                    html = html.replace(b, Util.getLocaleString(LanguageSelector.currentLocale, key));
                }
            }
            if (elm.innerHTML !== html) {
                elm.innerHTML = html;
            }
        });
    }

    static get currentLocale() {
        if (!LanguageSelector.#currentLocale) {
            LanguageSelector.#currentLocale = Util.getLocaleUserChoice({
                cookieName: LanguageSelector.COOKIE_NAME,
                paramName: LanguageSelector.PARAMETER_NAME
            });
        }
        return LanguageSelector.#currentLocale;
    }
}

LanguageSelector.currentLocale;

TC.control = TC.control || {};
TC.control.LanguageSelector = LanguageSelector;
customElements.get(controlElementName) || customElements.define(controlElementName, LanguageSelector);
export default LanguageSelector;

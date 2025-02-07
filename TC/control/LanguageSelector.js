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
        self.#link = self.querySelector(`a.${self.CLASS}`);
        if (!self.#link) {
            self.#link = document.createElement('a');
            self.#link.classList.add(self.CLASS);
            self.appendChild(self.#link);
        }

        if (options) {
            self.fullCode = options.fullCode;
            self.shortCode = options.shortCode;
            self.description = options.description;
        }
    }

    connectedCallback() {
        this.#onShortCodeChange();
        this.#onDescriptionChange();
    }

    static get observedAttributes() {
        return ['full-code', 'short-code', 'description', 'href'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (name === 'short-code') {
            this.#onShortCodeChange();
        }
        else if (name === 'description') {
            this.#onDescriptionChange();
        }
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
        this.setAttribute('short-code', value);
    }

    #onShortCodeChange() {
        const shortCode = this.shortCode;
        this.#link.dataset.langCode = shortCode;
        let parent = this;
        do {
            parent = parent.parentElement;
        }
        while (parent && !(parent instanceof LanguageSelector));
        this.#link.href = parent?.getUrl(shortCode);
        this.#link.innerHTML = shortCode;
    }

    get description() {
        return this.getAttribute('description');
    }

    set description(value) {
        this.setAttribute('description', value);
    }

    #onDescriptionChange() {
        this.#link.setAttribute('title', this.description);
    }

    get href() {
        return this.#link.getAttribute('href');
    }

    set href(value) {
        this.#link.setAttribute('href', value);
    }


}

LanguageOption.prototype.CLASS = 'tc-ctl-lang-link';
customElements.get(optionElementName) || customElements.define(optionElementName, LanguageOption);

const controlElementName = 'sitna-language-select'

class LanguageSelector extends WebComponentControl {
    static PARAMETER_NAME = "lang";
    static COOKIE_NAME = 'SITNA.language';
    static #currentLocale;

    constructor() {
        super(...arguments);

        const self = this;

        self.languages = [];
        if (self.options.static) {
            self.static = true;
        }
        if (self.options.noReload) {
            self.noReload = true;
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
        if (!self.static) {
            self.collapsed = self.collapsed || true;
        }        
        const languages = Array.from(self.querySelectorAll('sitna-language-option'));
        if (languages.length) {
            self.languages = languages;
        }
    }

    static get observedAttributes() {
        return ['static', 'collapsed','noreload'];
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
        if (name === 'noreload') {
            self.noReload = self.hasAttribute(name);
        }
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

    get noReload() {
        return this.hasAttribute('noreload');
    }

    set noReload(value) {
        const self = this;
        if (value) {
            self.setAttribute('noreload', '');
        }
        else {
            self.removeAttribute('noreload');
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

    async loadTemplates() {
        const self = this;
        const module = await import('../templates/tc-ctl-lang-select.mjs');
        self.template = module.default;
    }

    async render() {
        const self = this;
        await self.renderData({ languages: self.languages });
        const linkContainer = self.querySelector(`.${self.CLASS}-links`);
        let activeLink;
        self.languages.forEach(language => {
            linkContainer.appendChild(language);
            const link = language.querySelector(`a.${language.CLASS}`);
            if (LanguageSelector.currentLocale === language.fullCode) {
                activeLink = link;
            }
        });
        activeLink ??= (self.languages.find((lang) => lang.fullCode === LanguageSelector?.currentLocale) || self.languages[0])?.querySelector(`a.${self.languages[0].CLASS}`);
        activeLink?.classList.add(Consts.classes.ACTIVE);
        self.toggle = self.querySelector(`.${self.CLASS}-toggle`);

        self.addUIEventListeners();
    }

    addUIEventListeners() {
        const self = this;
        self.languages.forEach(language => {
            const link = language.querySelector(`a.${language.CLASS}`);
            link.addEventListener(Consts.event.CLICK, function (e) {
                e.preventDefault();
                self.setLanguage(e.target.dataset.langCode);
            });
        });
        self.toggle.addEventListener(Consts.event.CLICK, function (_e) {
            self.collapsed = !self.collapsed;
        });
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
        if (self.noReload) {
            const lang = self.languages.find((lang) => lang.shortCode === code).fullCode;
            LanguageSelector.currentLocale = lang;
            self.map.setLanguage(lang).then(() => {
                console.log("language changed");
            }, (err) => {
                console.log("language not changed: " + err);
            });
        }
        else
            window.location.href = self.getUrl(code);            
        //window.location.href = self.getUrl(code);
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

    static set currentLocale(lang) {
        var expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);
        var hyphenIdx = lang.indexOf('-');
        if (hyphenIdx >= 0) {
            lang = lang.substr(0, hyphenIdx);
        }
        Util.storage.setCookie(LanguageSelector.COOKIE_NAME, lang, { expires: expirationDate });
    }
    static get cookieName() {
        return LanguageSelector.COOKIE_NAME;
    }

    static set cookieName(value) {        
        const refreshValue = LanguageSelector.COOKIE_NAME != value;        
        LanguageSelector.COOKIE_NAME = value;
        LanguageSelector.#currentLocale = null;
    }
}

LanguageSelector.currentLocale;

TC.control = TC.control || {};
TC.control.LanguageSelector = LanguageSelector;
LanguageSelector.prototype.CLASS = 'tc-ctl-lang-select';
customElements.get(controlElementName) || customElements.define(controlElementName, LanguageSelector);
export default LanguageSelector;

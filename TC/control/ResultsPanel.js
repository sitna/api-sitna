(function () {
    var requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();


import TC from '../../TC.js';
import Consts from '../Consts.js';
import Util from '../Util.js';
import InfoDisplay from './InfoDisplay.js';
import itemToolContainer from './itemToolContainer.js';
import Button from '../../SITNA/ui/Button.js';
import Controller from '../Controller.js';
import Observer from '../Observer.js';
import ControlEvent from '../../SITNA/control/ControlEvent.js';

TC.control = TC.control || {};

Consts.event.DRAWCHART = 'drawchart.tc';
Consts.event.DRAWTABLE = 'drawtable.tc';
Consts.event.RESULTSPANELMIN = 'resultspanelmin.tc';
Consts.event.RESULTSPANELMAX = 'resultspanelmax.tc';
Consts.event.RESULTSPANELCLOSE = 'resultspanelclose.tc';
Consts.event.RESULTSPANELRESIZE = 'resultspanelresize.tc';

const isElementVisible = function (elm) {
    const computedStyle = getComputedStyle(elm);
    return elm && !elm.hidden && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
};

const hideResizeHandlers = function (ctl) {
    document.querySelectorAll('.' + ctl.CLASS + '-resize-handler').forEach((el) => {
        el.classList.add(Consts.classes.HIDDEN);
    });
};

const collidingManagement = {
    add: function (currentPanel) {
        const pbody = currentPanel.div.querySelector(".tc-ctl-rpanel-sidebar-body");
        pbody.style.bottom = "";
        let bottomSum = 0;
        //Lista de paneles visibles ordenados de mas abajo a mas arribade la pantalla
        currentPanel.map.getControlsByClass(ResultsPanel)
            .filter(panel => panel !== currentPanel && !panel.div.classList.contains("tc-hidden"))
            .map(panel => panel.div.querySelector(".tc-ctl-rpanel-sidebar-body"))
            .sort((panel1, panel2) => panel2.getBoundingClientRect().bottom - panel1.getBoundingClientRect().bottom)
            .forEach(panel => {
                if (pbody.colliding(panel)) {
                    pbody.style.bottom = (bottomSum + panel.clientHeight) + "px";
                    bottomSum = panel.clientHeight
                }

            });
    },
    remove: function (currentPanel) {
        currentPanel.map.getControlsByClass(ResultsPanel)
            .filter(panel => panel !== currentPanel && !panel.div.classList.contains("tc-hidden"))
            .forEach((panel, i, panels) => {
                if (i === 0)
                    panel.div.querySelector(".tc-ctl-rpanel-sidebar-body").style.bottom = "";
                else
                    panel.div.querySelector(".tc-ctl-rpanel-sidebar-body").style.bottom = (window.innerHeight - panels[0].div.querySelector(".tc-ctl-rpanel-sidebar-body").getBoundingClientRect().bottom + panels[0].div.querySelector(".tc-ctl-rpanel-sidebar-body").clientHeight) + "px";
            });
    }
};

const getTime = function (timeFrom, timeTo) {
    var diff = timeTo - timeFrom;
    var d = {};
    var daysDifference = Math.floor(diff / 1000 / 60 / 60 / 24);
    diff -= daysDifference * 1000 * 60 * 60 * 24;

    var hoursDifference = Math.floor(diff / 1000 / 60 / 60);
    diff -= hoursDifference * 1000 * 60 * 60;

    d.h = hoursDifference + daysDifference * 24;

    var minutesDifference = Math.floor(diff / 1000 / 60);
    diff -= minutesDifference * 1000 * 60;

    d.m = minutesDifference;

    d.s = Math.floor(diff / 1000);

    return Util.extend({}, d, { toString: ("00000" + d.h).slice(-2) + ':' + ("00000" + d.m).slice(-2) + ':' + ("00000" + d.s).slice(-2) });
};

class ResultsPanelModel {
    constructor() {
        //super();        
        this.title = "";
        this.close = "";
        this.hide = "";
        this.expand = "";
        this.download = "";
        this.shareQuery = "";        
    }
}

class ResultsPanel extends InfoDisplay {
    COLLIDING_PRIORITY = {
        IGNORE: 0,
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3
    };
    CHART_SIZE = {
        MIN_HEIGHT: 75,
        MAX_HEIGHT: 128,

        //MIN_WIDTH: 215,
        //MEDIUM_WIDTH: 310,
        //MAX_WIDTH: 445
    };
    contentType = {
        TABLE: {
            fnOpen: ResultsPanel.prototype.openTable,
            collapsedClass: `.${ResultsPanel.prototype.CLASS}-minimized-max-table`
        },
        CHART: {
            fnOpen: ResultsPanel.prototype.openChart,
            collapsedClass: `.${ResultsPanel.prototype.CLASS}-minimized-max-chart`
        }
    };
    #titles;

    constructor() {
        super(...arguments);
        const self = this;

        self.#titles = self.options.titles;
        self.wrap = new TC.wrap.control.ResultsPanel(self);

        self.data = {};
        self.classes = {
            SHOW_IN: 'tc-show-in',
            SHOW_OUT: 'tc-show-out',
            RESIZABLE: 'tc-resizable',
            POSITION_BOTTOM: 'tc-pos-bottom',
            POSITION_TOP: 'tc-pos-top'
        };

        self.content = self.contentType.TABLE;

        self._toolContainerSelector = `.${self.CLASS}-tools`;

        if (Util.isEmptyObject(self.options)) {
            self.options = { content: "table" };
        }

        if (self.options || { content: "table" }) {
            if (self.options.content)
                self.content = self.contentType[self.options.content.toUpperCase()];

            if (self.options.chart)
                self.chart = self.options.chart;

            if (self.options.table)
                self.table = self.options.table;

            if (self.options.save)
                self.save = self.options.save;

            if (self.options.share)
                self.share = self.options.share;

        }
        self.model = new ResultsPanelModel();
    }

    isVisible() {
        const bodyElm = this.div.querySelector('.tc-ctl-rpanel-sidebar-body');
        const maximizeElm = this.div.querySelector('.tc-ctl-rpanel-minimized-max');
        return isElementVisible(bodyElm) || isElementVisible(maximizeElm);
    }

    isMinimized() {
        const bodyElm = this.div.querySelector('.tc-ctl-rpanel-sidebar-body');
        const maximizeElm = this.div.querySelector('.tc-ctl-rpanel-minimized-max');
        return isElementVisible(maximizeElm) && !isElementVisible(bodyElm);
    }
    #manageClassList(classElement, toAdd, toRemove) {
        const elm = this.div.querySelector('.' + classElement);
        if (elm) {
            elm.classList.add(toAdd);
            elm.classList.remove(toRemove);
        }
    }
    //#manageClassList(classElement, toAdd, toRemove) {
    //    const elm = this.div.querySelector('.' + classElement);
    //    if (elm) {
    //        return new Promise(resolve => {
    //            const onEnd = () => {
    //                elm.removeEventListener('animationend', onEnd);
    //                resolve();
    //            };
    //            if (elm.classList.contains(toAdd)) {
    //                onEnd();
    //                return;
    //            }
    //            elm.addEventListener('animationend', onEnd, { once: true });
    //            elm.classList.add(toAdd);
    //            elm.classList.remove(toRemove);
    //            if (!getComputedStyle(elm).animationName) onEnd();
    //        });            
    //    }
    //    return true;
    //}

    show(classElement) {
        const elm = this.div.querySelector('.' + classElement);
        if (elm && elm.style.display === 'none') {
            elm.style.display = '';
        }

        this.#manageClassList(classElement, this.classes.SHOW_IN, this.classes.SHOW_OUT);
    }

    hide(classElement) {
        classElement = classElement ?? 'tc-ctl-rpanel-sidebar-body';        

        const elm = this.div.querySelector('.' + classElement);
        if (elm) {
            elm.style.display = 'none';
        }        
        this.#manageClassList(classElement, this.classes.SHOW_OUT, this.classes.SHOW_IN);
    }

    doVisible() {
        this.div.classList.remove(Consts.classes.HIDDEN);
        this.show('tc-ctl-rpanel-sidebar-body');
    }

    async loadTemplates() {
        const self = this;
        const mainTemplatePromise = import('../templates/tc-ctl-rpanel.mjs');
        const tableTemplatePromise = import('../templates/tc-ctl-rpanel-table.mjs');
        //const chartTemplatePromise = import('../templates/tc-ctl-rpanel-chart.mjs');

        const template = {};
        template[self.CLASS] = (await mainTemplatePromise).default;
        template[self.CLASS + '-table'] = (await tableTemplatePromise).default;
        //template[self.CLASS + '-chart'] = (await chartTemplatePromise).default;
        self.template = template;
    }

    #addItemTool(classNamePartial, localeKey, actionFn) {
        const self = this;
        self.addItemTool({
            renderFn: function (container) {
                //<sitna-button variant="minimal" icon-text="&#xe917;" class="tc-ctl-rpanel-btn-zoom" hidden text="{{i18n "shareQuery"}}"></sitna-button>
                const className = self.CLASS + classNamePartial;
                let button = container.querySelector('sitna-button.' + className);
                if (button) {
                    button.remove();
                    button = null;
                }
                const text = self.getLocaleString(localeKey);
                button = new Button();
                button.variant = Button.variant.MINIMAL;
                button.text = text;
                button.classList.add(className);
                if (self.model) {                    
                    button.text = "[[" + localeKey + "]]";
                    self.controller.add(button);
                    self.model[localeKey] = self.getLocaleString(localeKey);
                }
                return button;
            },
            actionFn: actionFn
        });
    }

    async render(callback) {
        const self = this;

        self.div.classList.add(Consts.classes.HIDDEN);

        await super.render.call(self);
        
        /* --- LEGACY --- */
        self.minimizeButton = self.div.querySelector('.tc-ctl-rpanel-btn-min') ||
            self.div.querySelector('.prcollapsed-slide-submenu-min');
        self.minimizeButton.addEventListener('click', function () {
            self.minimize();
        });

        /* --- LEGACY --- */
        self.closeButton = self.div.querySelector('.tc-ctl-rpanel-btn-close') ||
            self.div.querySelector('.prcollapsed-slide-submenu-close');
        self.closeButton.addEventListener('click', function () {
            self.close();
            const resizedTarget = self.div.querySelector(`.${self.classes.RESIZABLE}.tc-ctl-rpanel-main`);
            if (resizedTarget) {
                // si el usuario cierra el panel desde el aspa, eliminamos el rastro del redimensionado para empezar de cero
                delete resizedTarget.style.removeProperty("width");
                delete resizedTarget.style.removeProperty("height");
                delete resizedTarget.dataset.chartSizeWidth;
                delete resizedTarget.dataset.chartSizeHeight;
                delete resizedTarget.dataset.panelSizeWidth;
                delete resizedTarget.dataset.panelSizeHeight;
            }
        });

        /* --- LEGACY --- */
        self.maximizeButton = self.div.querySelector('.tc-ctl-rpanel-minimized-max') ||
            self.div.querySelector('.prcollapsed-max');
        self.maximizeButton.addEventListener('click', function () {
            self.maximize();
        });
        //<sitna-button variant="minimal" class="tc-ctl-rpanel-btn-csv" hidden text="{{i18n "export.excel"}}"></sitna-button>
        if (self.save) {            
            self.#addItemTool('-btn-csv', 'export.excel', function () {
                self.exportToExcel();
            });
        }

        if (self.options.download && self.options.content === "table") {
            self.#addItemTool('-btn-dwn', 'download', function () {
                if (Util.isFunction(self.options.download)) {
                    self.options.download.apply(self, []);
                }
            });
        }
        if (self.options.share) {
            self.#addItemTool('-btn-share', 'shareQuery', function () {
                if (self.caller) {
                    self.caller.showShareDialog();
                }
            });
        }
        if (self.content) {
            self.content = self.content;

            if (self.#titles) {
                self.setTitles(self.#titles);
            } else {
                self.model.title = self.getLocaleString("rsp.title");
            }
        }

        /* --- LEGACY --- */
        self.infoDiv = self.div.querySelector('.tc-ctl-rpanel-info') ||
            self.div.querySelector('.tc-ctl-p-result-info');
        /* --- LEGACY --- */
        self.tableDiv = self.div.querySelector('.tc-ctl-rpanel-table') ||
            self.div.querySelector('.tc-ctl-p-result-table');
        //self.$divChart = self._$div.find('.' + self.CLASS + '-chart');
        /* --- LEGACY --- */
        self.menuDiv = self.div.querySelector('.tc-ctl-rpanel-menu') ||
            self.div.querySelector('.tc-ctl-p-result-menu');

        if (TC.browserFeatures.touch()) {
            Util.swipe(self.div, {
                left: function () {
                    self.minimize();
                }
            });
        }

        if (!Util.detectMobile()) {
            const doResizable = !(Object.hasOwn(self.options, "resize") && !self.options.resize);
            switch (true) {
                case self.options.content === "chart" && doResizable: // si es un perfil de elevación
                case self.options.resize: // si está configurado a true
                case self.options.content === "table" && self.infoDiv && self.infoDiv.childElementCount > 0 && doResizable: // si es una tabla y es el renderizado de GFI
                    self.resizable = true;
                    self.div.classList.add(self.classes.RESIZABLE);
                    break;
                default:
                    self.resizable = false;
                    break;
            }
        } else {
            hideResizeHandlers(self);
        }

        if (callback && typeof callback === "function") {
            callback();
        }

        self.controller = new Controller(self.model, new Observer(self.div));
        self.updateModel()

        return self;
    }

    setTitles(titles = {}) {
        if (titles.main) {
            this.model.title = titles.main;
            this.#titles.main = titles.main;
        }

        if (titles.max) {
            this.maximizeButton.setAttribute('title', titles.max);
            this.#titles.max = titles.max;
        }
        return this;
    }

    renderPanelResizable(options = {}) {
        const self = this;
        import('interactjs').then(function (module) {
            const interact = module.default;
            const target = "." + self.classes.RESIZABLE;
            const targetNodeSelector = '.tc-ctl-rpanel-main';
            const targetNode = options.target && options.target.querySelector(targetNodeSelector) ||
                document.querySelector(targetNodeSelector);
            targetNode.classList.add(self.classes.RESIZABLE);
            targetNode.closest('.tc-ctl-rpanel').classList.add(self.classes.RESIZABLE);
            if (!interact.isSet(target)) {
                const svg = document.querySelector('.tc-chart.c3 svg');
                if (svg) {
                    svg.parentElement.style.maxHeight = 'unset';
                    svg.removeAttribute('max-height');
                    svg.removeAttribute('max-width');
                    svg.removeAttribute('min-height');
                    svg.removeAttribute('min-width');
                }
                const interactable = interact(target)
                    .resizable({
                        preserveAspectRatio: options.preserveAspectRatio || true,
                        edges: {
                            right: '.tc-ctl-rpanel-resize-handler',
                            bottom: '.tc-ctl-rpanel-resize-handler'
                        },
                        cursorChecker(_action, _interactable, element, _interacting) {
                            let cursor = "";
                            let currentHandlers = element.querySelectorAll(':hover');
                            currentHandlers.forEach(function (handler) {
                                switch (true) {
                                    case handler.classList.value.indexOf("tc-resizable-grid-handlerRight") > -1:
                                        cursor = 'w-resize';
                                        break;
                                    case handler.classList.value.indexOf("tc-resizable-grid-handlerBottom") > -1:
                                        cursor = 'n-resize';
                                        break;
                                    case handler.classList.value.indexOf("tc-resizable-grid-handlerDiagonal") > -1:
                                        cursor = 'nw-resize';
                                        break;
                                    default:
                                        cursor = 'pointer';
                                }
                            });
                            return cursor;
                        },
                        listeners: {
                            end: function (event) {
                                self.onResize(event);
                            },
                            move(event) {
                                switch (true) {
                                    case event.target.style.cursor === 'w-resize':
                                        Object.assign(event.target.style, {
                                            width: `${event.rect.width}px`,
                                            height: `${event.target.getBoundingClientRect().height}px`
                                        });
                                        break;
                                    case event.target.style.cursor === 'nw-resize':
                                        Object.assign(event.target.style, {
                                            width: `${event.rect.width}px`,
                                            height: `${event.rect.height}px`
                                        });
                                        break;
                                    case event.target.style.cursor === 'n-resize':
                                        Object.assign(event.target.style, {
                                            width: `${event.target.getBoundingClientRect().width}px`,
                                            height: `${event.rect.height}px`
                                        });
                                        break;
                                    default:
                                        break;
                                }

                                if (event.target.querySelector('.tc-chart.c3')) {
                                    event.target.classList.add(Consts.classes.LOADING);
                                }
                            }
                        },
                        modifiers: [
                            interact.modifiers.restrict({
                                restriction: 'body'
                            })
                        ]
                    });

                if (options.callback && Util.isFunction(options.callback)) {
                    options.callback();
                }
            }
        });
    }

    getResultsPanelFromElement(element) {
        let resultsPanels = this.map.getControlsByClass(ResultsPanel);
        for (var i = 0; i < resultsPanels.length; i++) {
            if (resultsPanels[i].div.querySelector(`.${this.classes.RESIZABLE}.tc-ctl-rpanel-main`) === element) {
                return resultsPanels[i];
            }
        }

        return null;
    }

    onResize(e) {
        const self = this;
        const target = e.target;
        const profile = self.div.querySelector('sitna-elevation-profile');
        if (profile) {
            target.classList.remove(Consts.classes.LOADING);
            const newSize = profile.getChartSize();
            if (newSize) {
                profile.chart.chart.resize(profile.getBoundingClientRect());
                const resizedTarget = self.div.querySelector(`.${self.classes.RESIZABLE}.tc-ctl-rpanel-main`);
                resizedTarget.dataset.chartSizeWidth = newSize.width;
                resizedTarget.dataset.chartSizeHeight = newSize.height;
            }
        }
        self.map.trigger(Consts.event.RESULTSPANELRESIZE, {
            control: self, size: {
                width: target.getBoundingClientRect().width,
                height: target.getBoundingClientRect().height
            }
        });
    }

    minimize() {
        const self = this;

        const collapsedElm = self.div.querySelector(self.content.collapsedClass);
        if (collapsedElm.classList.contains(Consts.classes.HIDDEN)) { // ya está minimizado
            collapsedElm.classList.remove(Consts.classes.HIDDEN);

            self.hide('tc-ctl-rpanel-sidebar-body');
            self.show('tc-ctl-rpanel-minimized-max');

            self.map.trigger(Consts.event.RESULTSPANELMIN, { control: self });
            collidingManagement.remove(self);
        }
        return self;
    }

    maximize() {
        const self = this;

        const collapsedElm = self.div.querySelector(self.content.collapsedClass);
        if (!collapsedElm.classList.contains(Consts.classes.HIDDEN)) { // ya está maximizado
            collapsedElm.classList.add(Consts.classes.HIDDEN);

            self.show('tc-ctl-rpanel-sidebar-body');
            self.hide('tc-ctl-rpanel-minimized-max');

            self.map.trigger(Consts.event.RESULTSPANELMAX, { control: self });
            collidingManagement.add(self);
        }
        return self;
    }

    close() {
        const self = this;

        self.div.classList.add(Consts.classes.HIDDEN);

        if (self.chart && self.chart.chart) {
            // preservamos el tamaño redimensionado por el usuario
            const resizedTarget = self.div.querySelector(`.${self.classes.RESIZABLE}.tc-ctl-rpanel-main`);
            if (resizedTarget && resizedTarget.style && resizedTarget.style.width && resizedTarget.style.height) {
                const chartElement = resizedTarget.querySelector('.tc-chart');
                const chartBounding = chartElement.getBoundingClientRect();
                // cuando el panel está colapsado no tenemos disponible el tamaño del perfil
                if (parseInt(chartBounding.width) > 0 && parseInt(chartBounding.height) > 0) {
                    resizedTarget.dataset.chartSizeWidth = chartBounding.width;
                    resizedTarget.dataset.chartSizeHeight = chartBounding.height;
                }
                resizedTarget.dataset.panelSizeWidth = resizedTarget.style.width;
                resizedTarget.dataset.panelSizeHeight = resizedTarget.style.height;
            }
            self.chart.chart = self.chart.chart.destroy();
        }

        const body = self.getContainerElement();
        if (body) {
            body.style.display = 'none';
            self.div.querySelector('.tc-ctl-rpanel-minimized-max').style.display = 'none';
            body.querySelectorAll('video,audio,iframe').forEach(elm => elm.remove());

            const collapsedElm = self.div.querySelector(self.content.collapsedClass);
            collapsedElm.classList.add(Consts.classes.HIDDEN);

            let resizable = document.querySelector("." + self.classes.RESIZABLE);
            if (resizable) {
                resizable.style = "";
            }
            if (self.currentFeature) {
                self.currentFeature.toggleSelectedStyle(false);
            }
            self.map.trigger(Consts.event.RESULTSPANELCLOSE, { control: self, feature: self.currentFeature });

            //URI: Resetear el bottom de los paneles 
            collidingManagement.remove(self);

        }
        return self;
    }

    setCurrentFeature(feature) {
        if (this.currentFeature) {
            this.currentFeature.toggleSelectedStyle(false);
        }
        this.currentFeature = feature;
        if (feature) {
            feature.toggleSelectedStyle(true);
        }
    }

    openChart(data) {
        const self = this;

        self.onOpen();
        self.div.classList.remove(Consts.classes.HIDDEN);

        // Cerramos el resto de los perfiles
        self.map.getControlsByClass(ResultsPanel)
            .filter(function (ctl) {
                return ctl !== self;
            })
            .filter(function (ctl) {
                return ctl.options.content === 'chart';
            })
            .forEach(function (ctl) {
                ctl.close();
            });

        const profileControl = this.getElevationProfileControl();

        if (data) {

            if (data.msg) {
                self.map.toast(data.msg);
                if (self.isVisible()) {
                    self.hide('tc-ctl-rpanel-sidebar-body');
                }
            }
            else {
                profileControl.renderChart({ data });
            }
        }
        return self;
    }

    #closeOpenedTableResultsPanel() {
        this.map.getControlsByClass(ResultsPanel)
            .filter((ctl) => ctl !== this && ctl.isVisible())
            .filter((ctl) => ctl.options.content !== 'chart')
            .forEach((ctl) => ctl.close());
    }

    getElevationProfileControl() {
        let control = this.div.querySelector('sitna-elevation-profile');
        if (!control) {
            control = document.createElement('sitna-elevation-profile');
            const container = this.div.querySelector('.' + this.CLASS + '-chart');
            container.appendChild(control);
            control.caller = this.caller;
        }
        return control;
    }

    openTable() {
        const self = this;

        self.onOpen();
        self.div.classList.remove(Consts.classes.HIDDEN);

        var data = arguments[0];
        if (data) {

            var css;
            if (data.css) {
                css = data.css;
            }
            var callback = data.callback;
            var columns = data.columns;

            if (data.data && data.data.length > 0) {
                //Si no recibe columnas, las extrae de las claves del primer objeto de la colección de datos
                if (!columns) {
                    columns = [];
                    for (var k in data.data[0]) {
                        columns.push(k);
                    }
                }

                //deleteColumns();

                self.tableData = {
                    columns: columns,
                    results: data.data,
                    css: css,
                    callback: callback,
                    sort: data.sort ? {} : null
                };
                var scrollPosition = null;
                const _sort = (tableData, field, order) => {
                    var sortedDataTable = tableData;
                    if (field) {
                        const mappedArr = self.tableData.results.map(function (el, i) {
                            return { index: i, properties: el };
                        });
                        mappedArr.sort((a, b) => {
                            const valorA = a.properties[field] || "";
                            const valorB = b.properties[field] || "";
                            if (order)
                                if (typeof (valorA) === "string")
                                    return valorA.localeCompare(valorB)
                                else
                                    return valorA < valorB ? -1 : (valorA == valorB ? 0 : 1);
                            else
                                if (typeof (valorB) === "string")
                                    return valorB.localeCompare(valorA)
                                else
                                    return valorA < valorB ? 1 : (valorA == valorB ? 0 : -1);
                        });

                        sortedDataTable = Object.assign({}, tableData, {
                            results: mappedArr.map(function (el) {
                                return Object.assign({}, el.properties, { index: el.index });
                            })
                        });
                        sortedDataTable.sort = { field: field, order: order };
                    }
                    self.getRenderedHtml(self.CLASS + '-table', sortedDataTable).then(function (html) {
                        const table = self.div.querySelector('.tc-ctl-rpanel-table');
                        const parent = table.parentElement;
                        parent.removeChild(table);
                        table.innerHTML = html;
                        parent.appendChild(table);
                        if (tableData.callback) {
                            tableData.callback(table);
                        }
                        if (sortedDataTable.sort) {
                            table.querySelectorAll("thead th").forEach(th => {
                                th.addEventListener("click", e => {
                                    scrollPosition = e.target.offsetParent.scrollLeft;
                                    const field = e.target.dataset.orderField || e.target.innerText

                                    if (sortedDataTable.sort.field === field && sortedDataTable.sort.order)
                                        _sort(tableData, field, false);
                                    else if (sortedDataTable.sort.field === field && !sortedDataTable.sort.order) {
                                        _sort(tableData, field, true);
                                    } else {
                                        _sort(tableData, field, true);
                                    }
                                });
                            });
                        }
                        self.#closeOpenedTableResultsPanel();

                        const titleBar = self.div.querySelector('.tc-ctl-rpanel-title');
                        self.getItemTools().forEach(tool => self.addItemToolUI(titleBar, tool));

                        self.map.trigger(Consts.event.DRAWTABLE, { control: self });
                        self.map.dispatchEvent(new ControlEvent(Consts.event.INFODISPLAY, { control: self }));
                        if (scrollPosition) {
                            table.scrollLeft = scrollPosition;
                        }

                    });
                };
                _sort(self.tableData);

                self.div.querySelector('.tc-ctl-rpanel-chart').style.display = 'none';
                self.div.querySelector('.tc-ctl-rpanel-info').style.display = 'none';

                self.show('tc-ctl-rpanel-sidebar-body');
                collidingManagement.add(self);
            }
        }
    }

    async open(html, container, options = {}) {
        const self = this;

        self.onOpen();
        self.div.classList.remove(Consts.classes.HIDDEN);

        const toCheck = container || self.div.querySelector('.tc-ctl-rpanel-table');
        var checkIsRendered = function () {
            var clientRect = toCheck.getBoundingClientRect();
            if (clientRect && clientRect.width > 30 && clientRect.height > 0) {
                //window.cancelAnimationFrame(this.requestIsRendered);

                const titleBar = self.div.querySelector('.tc-ctl-rpanel-title');
                self.getItemTools().forEach(tool => self.addItemToolUI(titleBar, tool));
                //self.#closeOpenedTableResultsPanel();
                this.map.trigger(Consts.event.DRAWTABLE, { control: self });
                self.map.dispatchEvent(new ControlEvent(Consts.event.INFODISPLAY, { control: self }));
            }

        };
        //checkIsRendered.apply(self);
        self.requestIsRendered = window.requestAnimationFrame(checkIsRendered.bind(self));

        const chartElm = self.div.querySelector('.tc-ctl-rpanel-chart');
        //chartElm.style.display = 'none';
        //chartElm.innerHTML = '';
        const tableElm = self.div.querySelector('.tc-ctl-rpanel-table');
        //tableElm.style.display = 'none';
        //tableElm.innerHTML = '';
        const infoElm = self.div.querySelector('.tc-ctl-rpanel-info');
        //infoElm.style.display = 'none';
        //infoElm.innerHTML = '';

        if (html) {
            let containerElm;
            if (container) {
                containerElm = container;
                self.getTableContainer = function () {
                    return container;
                };
            } else {
                containerElm = tableElm;
            }
            containerElm.style.display = '';
            if (options.shadow) {
                containerElm = containerElm.shadowRoot ?? containerElm.attachShadow({ mode: 'open' });
            }
            containerElm.innerHTML = html;
        }
        else {
            if (chartElm.childElementCount) {
                chartElm.style.display = '';
            }
            else if (tableElm.childElementCount) {
                tableElm.style.display = '';
            }
            else if (infoElm.childElementCount) {
                infoElm.style.display = '';
            }
        }

        const maximizeElm = self.div.querySelector('.tc-ctl-rpanel-minimized-max');

        if (self.#titles) {

            if (self.#titles.main) {
                self.setTitles(self.#titles);
            }

            if (self.#titles.max) {
                maximizeElm.setAttribute('title', self.#titles.max);
            }
        }

        if (self.options.classes) {
            if (self.options.classes.collapsed) {
                maximizeElm.querySelector('span.tc-ctl-rpanel-minimized-max-table').classList.add(self.options.classes.collapsed);
            }
        }

        // si está minimizado
        const collapsedElm = self.div.querySelector(self.content.collapsedClass);
        if (isElementVisible(collapsedElm)) {
            self.maximize();
        }

        self.show('tc-ctl-rpanel-sidebar-body');
        self.hide('tc-ctl-rpanel-minimized-max');
        //URI: Evitar solapamentos entre paneles en modo móvil
        collidingManagement.add(self);        
        return self;
    }

    onOpen() {
        const self = this;
        if (self.resizable) {
            self.renderPanelResizable({ target: self.div, preserveAspectRatio: true });
        }
        else {
            hideResizeHandlers(self);
        }
    }

    loadDataOnChart(data) {
        const self = this;
        const endFn = function () {
            const container = self.div.querySelector('.' + self.CLASS + '-chart');
            let chart = container.querySelector('sitna-elevation-profile');
            if (!chart) {
                chart = document.createElement('sitna-elevation-profile');
                container.appendChild(chart);
            }
            chart.renderChart({ data, isSecondary: true });
        };
        // puede llegar aquí después de borrar un track.
        if (self.chart && self.chart.chart) {
            self.chart.chart.unload({
                done: endFn
            });
        }
        else {
            endFn();
        }
    }

    getElevationChartTooltip(data) {
        const self = this;

        const locale = self.map.getLocale() || undefined;
        const coords = self.getElevationProfileChartData().coords;
        const getElevationByDataElem = function (dataElem) {
            return dataElem.value ? parseInt(dataElem.value.toFixed(0)).toLocaleString(locale) : "0";
        };
        const p = coords[data[0].index];
        let doneTime;
        if (coords[0].length === 4 && coords[0][3] > 0 && p) {
            doneTime = getTime(coords[0][3], p[3]);
        }
        let distance = data[0].x / 1000;
        let distanceFormatted = (distance < 1 ? Math.round(distance * 1000) : Math.round(distance * 100) / 100).toLocaleString(locale) + (distance < 1 ? ' m' : ' km');

        let elevationDiv = `<div class="${self.classes.POSITION_TOP}">` +
            '<span>' +
            data.map((elem, index) => {
                if (elem) {
                    let classCss;
                    switch (elem.id) { 
                        case "mdt":
                            classCss = "tc-mdt";
                            break;
                        case "mds":
                            classCss = "tc-mds";
                            break;
                        case "gps":
                        default:
                            classCss = "tc-original";
                            break;
                    }
                    return index === 0 ? '<span data-isNumber class="' + classCss + '">' + getElevationByDataElem(elem) + ' m' + '</span>' :
                        '<span data-isNumber class="' + classCss + '">' + getElevationByDataElem(elem) + ' m ' + '</span>';
                } else {
                    return "";
                }
            }).join('') +
            '</span >' +
            '</div>';

        let distanceAndTimeDiv = `<div class="${self.classes.POSITION_BOTTOM}"><span>${distanceFormatted} </span>` +
            (doneTime ? '<span>' + doneTime.toString + '</span><div/>' : '<div/>');


        return elevationDiv + distanceAndTimeDiv;
    }

    getTableContainer() {
        return this.tableDiv;
    }

    getInfoContainer() {
        return this.infoDiv;
    }

    getMenuElement() {
        return this.menuDiv;
    }

    getContainerElement() {
        return this.div.querySelector('.tc-ctl-rpanel-sidebar-body');
    }

    async register(map) {
        const self = this;

        await super.register.call(self, map);

        self.wrap.register(map);

        if (self.openOn) {
            self.map.one(self.openOn, function (e, _args) {
                self.content.fnOpen.call(self, e.data);
            });
        }

        if (self.closeOn) {
            self.map.one(self.closeOn, function (_e, _args) {
                self.close();
            });
        }

        if (self.options.openOn) {
            self.map.on(self.options.openOn, function (e, _args) {
                self.content.fnOpen.call(self, e.data);
            });
        }

        if (self.options.closeOn) {
            self.map.on(self.options.closeOn, function (_e, _args) {
                self.close();
            });
        }

        map
            .on(Consts.event.FEATUREREMOVE, function (e) {
                if (self.currentFeature === e.feature && self.isVisible()) {
                    self.close();
                }
            })
            .on(Consts.event.FEATURESCLEAR + ' ' + Consts.event.LAYERREMOVE, function (e) {
                if (self.currentFeature && self.currentFeature.layer === e.layer && self.isVisible()) {
                    self.close();
                }
            })
            .on(Consts.event.DRAWCHART, function (e) {
                if (e.control === self.div.querySelector("sitna-elevation-profile")) {
                    self.map.trigger(Consts.event.DRAWCHART, { control: self, svg: e.svg, chart: e.chart });
                }
            });

        //map.on(Consts.event.VIEWCHANGE, function () {

        //    map.getControlsByClass(ResultsPanel).filter(function (ctl) {
        //        return ctl.options.content !== "chart" && ($(ctl.div).find('.' + ctl.CLASS + '-info:visible').length === 1 || $(ctl.div).find('.' + ctl.CLASS + '-table:visible').length === 1);
        //    }).forEach(function (ctl) {
        //        ctl.close();
        //    });
        //});

        return self;
    }

    exportToExcel() {
        const self = this;

        var rows = [self.tableData.columns];

        self.tableData.results.forEach(function (value) {
            var row = [];
            for (var k in value) {
                if (Object.hasOwn(value, k) && k !== "Id" && k !== "Geom") { //Las columnas ID y Geom no aparece en la exportaci\u00f3n
                    row.push(value[k]);
                }
            }
            rows.push(row);
        });
        import('../tool/ExcelExport').then(function saveToExcel(module) {
            const ExcelExport = module.default;
            const exporter = new ExcelExport();
            var fileName = self.save.fileName ? self.save.fileName : 'resultados.xls';
            var title = self.#titles && self.#titles.main ? self.#titles.main : null;
            exporter.Save(fileName, rows, title);
        });
    }

    updateModel() {
        this.model.title = this?.#titles?.main || this.getLocaleString("rsp.title");
        this.model.close = this.getLocaleString("close");
        this.model.hide = this.getLocaleString("hide");
        this.model.expand = this.getLocaleString("expand");
        if(this.options.save)
            this.model['export.excel'] = this.getLocaleString("export.excel");
        this.model.download = this.getLocaleString("download");
        if (this.options.share)
            this.model.shareQuery = this.getLocaleString("shareQuery");
    }

}

ResultsPanel.prototype.CLASS = 'tc-ctl-rpanel';
TC.control.ResultsPanel = ResultsPanel;
TC.mix(ResultsPanel, itemToolContainer);
export default ResultsPanel;
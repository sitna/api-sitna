
document.querySelectorAll('.tc-map').forEach(function (elm) {
    const map = TC.Map.get(elm);

    if (map && !map._layoutDone) {

        /**
             * Array de condiciones para distintas resoluciones de pantalla. La estructura del array que recibe como parámetro es es:
             *  - screenCondition (string): media query que debe evaluarse a true para que se apliquen los cambios.
             *  - apply:
             *      - event (string): evento que debe producirse para que se lleve a cabo la acción.
             *      - elements (array o string): selectores CSS de los elementos sobre los que se debe producir el evento anterior.
             *      - changes:
             *          - targets (array o string): selectores CSS de los elementos a los que se aplicarán las clases CSS siguientes
             *          - classes (array o string): clases CSS a aplicar
             */
        TC.Cfg.applyChanges = function (configArray) {
            var changes = configArray instanceof Array ? configArray : [configArray];

            if (changes) {
                var map;
                changes.forEach(function (item) {
                    var elem = item.apply;
                    var clickedElems = elem.elements instanceof Array ? elem.elements : [elem.elements];
                    map = item.map || map || TC.Map.get(document.querySelector('.tc-map'));
                    map.div.addEventListener(elem.event, TC.EventTarget.listenerBySelector(clickedElems.join(), function () {
                        if (window.matchMedia(item.screenCondition).matches) { // si es una pantalla estrecha
                            elem.changes.forEach(function (change) {
                                var targets = Array.isArray(change.targets) ? change.targets : [change.targets];
                                var classes = Array.isArray(change.classes) ? change.classes : [change.classes];

                                map.div.querySelectorAll(targets.join()).forEach(function (elm) {
                                    classes.forEach(function (cls) {
                                        elm.classList.add(cls);
                                    });
                                });
                            });
                        }
                    }));
                });
            }
        };


        map.ready(function () {

            const ovPanel = map.div.querySelector('.ovmap-panel');
            const rcollapsedClass = 'right-collapsed';
            const lcollapsedClass = 'left-collapsed';
            var ovmap;

            map.div.querySelectorAll('.right-panel > h1').forEach(function (h1) {
                h1.addEventListener(TC.Consts.event.CLICK, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const tab = e.target;
                    const panel = tab.parentElement;
                    const isCollapsed = panel.classList.toggle(rcollapsedClass);
                    if (map && panel === ovPanel) {
                        if (ovmap) {
                            if (isCollapsed) {
                                ovmap.disable();
                            }
                            else {
                                setTimeout(function () {
                                    ovmap.enable();
                                }, 250);
                            }
                        }
                    }
                });
            });

            map.div.querySelectorAll('.left-panel > h1').forEach(function (h1) {
                h1.addEventListener(TC.Consts.event.CLICK, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const panel = e.target.parentElement;
                    panel.classList.toggle(lcollapsedClass);
                });
            });

            map.div.querySelector('.tools-panel').addEventListener(TC.Consts.event.CLICK, function (e) {
                const tab = e.target;
                if (tab.tagName === ('H2')) {
                    const ctlDiv = tab.parentElement;
                    if (map && map.layout && map.layout.accordion) {
                        if (ctlDiv.classList.contains(TC.Consts.classes.COLLAPSED)) {
                            this.querySelectorAll('h2').forEach(function (h2) {
                                const div = h2.parentElement;
                                if (div !== ctlDiv && !div.matches('.tc-ctl-search')) {
                                    div.classList.add(TC.Consts.classes.COLLAPSED);
                                }
                            });
                        }
                    }
                    ctlDiv.classList.toggle(TC.Consts.classes.COLLAPSED);
                }
            });          


            map.loaded(function () {

                ovmap = map.getControlsByClass('TC.control.OverviewMap')[0];
                if (ovmap) {
                    ovmap.loaded(function () {
                        ovmap.disable();
                    });
                }
                //mover el Multifeature info dentro del TOC
                const toc = map.getControlsByClass('TC.control.WorkLayerManager')[0];
                const mfi = map.getControlsByClass('TC.control.MultiFeatureInfo')[0];
                if (toc && mfi) {
                    toc.div.querySelector('.' + toc.CLASS + '-content').insertAdjacentElement('afterend', mfi.div);
                    mfi.containerControl = toc;
                }

                //Aplicar clases CSS cuando se haga click en elementos definidos por configuración
                TC.Cfg.applyChanges([
                    {
                        "map": map,
                        "screenCondition": "(max-width: 42em)",
                        "apply": {
                            "event": "click",
                            "elements": [".tc-ctl-bms-node > label"],
                            "changes": [
                                {
                                    "targets": "#tools-panel",
                                    "classes": "right-collapsed"
                                }
                            ]
                        }
                    }
                ]);
            });

            TC.Consts.event.TOOLSCLOSE = TC.Consts.event.TOOLSCLOSE || 'toolsclose.tc';
            TC.Consts.event.TOOLSOPEN = TC.Consts.event.TOOLSOPEN || 'toolsopen.tc';

            map.on(TC.Consts.event.TOOLSOPEN, function (e) {
                map.div.querySelector('.tools-panel').classList.remove(rcollapsedClass);
            });

            map.on(TC.Consts.event.TOOLSCLOSE, function (e) {
                map.div.querySelector('.tools-panel').classList.add(rcollapsedClass);
            });

            // En pantalla estrecha colapsar panel de herramientas al activar una
            map.on(TC.Consts.event.CONTROLACTIVATE, function (e) {
                const control = e.control;
                if (map.getControlsByClass('TC.control.Draw').filter(ctl => ctl === control).length) {
                    const toolsPanel = document.querySelector('.tools-panel');
                    if (getComputedStyle(map.div).height === getComputedStyle(toolsPanel).height) {
                        toolsPanel.classList.add(rcollapsedClass);
                    }
                }
            });

            if (TC.browserFeatures.touch()) {
                const addSwipe = function (direction) {
                    const selector = '.' + direction + '-panel';
                    const className = direction + '-collapsed';
                    const options = { noSwipe: 'li,a' };
                    options[direction] = function () {
                        this.classList.add(className);
                    };
                    map.div.querySelectorAll(selector).forEach(function (panel) {
                        TC.Util.swipe(panel, options);
                    });
                };
                addSwipe('right');
                addSwipe('left');
            }
            //TC.loadJS(
            //    Modernizr.touch,
            //    TC.apiLocation + 'FastClick/fastclick.min.js',
            //    function () {
            //        if (Modernizr.touch) {
            //            document.addEventListener('DOMContentLoaded', function () {
            //                Origami.fastclick(document.body);
            //            });
            //        }
            //    }
            //);

        });
    }
    map._layoutDone = true;
});


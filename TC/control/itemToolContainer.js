import TC from '../../TC';
import Util from '../Util';
import Consts from '../Consts';
import Toggle from '../../SITNA/ui/Toggle';

TC.Util = Util;
TC.control = TC.control || {};

// Mixin
const itemToolContainer = {

    _uiElementSelector: `ul > li`,
    _toolContainerSelector: '.tc-item-tools',
    isItemToolContainer: true,

    getItemTools: function () {
        const self = this;
        if (!self.itemTools) {
            self.itemTools = [];
        }
        return self.itemTools;
    },

    getItemUIElements: function (selector) {
        const self = this;
        if (selector) {
            self._uiElementSelector = selector;
        }
        return Array.from(self.div.querySelectorAll(self._uiElementSelector));
    },

    getToolContainer: function (itemElement) {
        const self = this;
        return itemElement.querySelector(self._toolContainerSelector);
    },

    addItemToolUI: function(elm, tool) {
        const self = this;
        if (Util.isFunction(tool.renderFn)) {
            const container = self.getToolContainer(elm);
            const button = tool.renderFn(container, elm.dataset.layerId);
            if (button) {
                const lastButton = container.querySelector(`.tc-item-tool-last`);
                if (lastButton) {
                    lastButton.insertAdjacentElement('beforebegin', button);
                }
                else {
                    container.appendChild(button);
                }
                if (Util.isFunction(tool.actionFn)) {
                    const eventName = (button instanceof Toggle) ? 'change' : Consts.event.CLICK;
                    button.addEventListener(eventName, function (_e) {
                        tool.actionFn.call(button);
                    }, { passive: true });
                }
                if (Util.isFunction(tool.updateFn) && tool.updateEvents) {
                    self.map.on(tool.updateEvents.join(' '), function (e) {
                        if (!e.layer || e.layer.id === button.dataset.layerId) {
                            tool.updateFn.call(button, e);
                        }
                    });
                }
            }
        }
    },

    addItemTool: function(options) {
        const self = this;
        self.getItemTools().push(options);
        self.getItemUIElements().forEach(function (elm) {
            self.addItemToolUI(elm, options);
        });
    }

};

TC.control.itemToolContainer = itemToolContainer;
export default itemToolContainer;
import TC from '../../TC.js';
import Util from '../Util.js';
import Consts from '../Consts.js';
import Share from './Share.js';

TC.control = TC.control || {};

// Mixin
TC.control.infoShare = {

    getDiv: function (divElement) {
        if (divElement) return divElement;
        if (this._dialogDiv) return this._dialogDiv;
        if (this instanceof HTMLElement) return this;
        return this.div;
    },

    getShareDialog: async function (divElement) {
        const dialogDiv = this.getDiv(divElement);
        if (!this._shareCtl) {
            const div = dialogDiv.querySelector('.tc-modal-body .' + this.CLASS + '-share-dialog-ctl');
            this._shareCtl = await this.map.addControl('share', {
                id: this.getUID(),
                div,
                includeControls: false,
                modes: [Share.mode.LINK, Share.mode.HTML],
            });
            div.id = this._shareCtl.id;
            this._shareCtl.caller = this;
            this._shareCtl.extraParams = null;
        }
        return this._shareCtl;
    },

    onShowShareDialog: async function () {
        this.toShare = this.toShare || {};
        this.toShare.doZoom = true;
        // para gestionar el zoom a la feature al compartir desde el control o el general, ya que la capa que contiene la feature no cambia por lo que no salta.
        this.map.trigger(Consts.event.MAPCHANGE);
        const shareCtl = this._shareCtl;
        const shareDiv = shareCtl.div;
        const link = await shareCtl.generateLink();
        const input = shareDiv.querySelector(".tc-url input[type=text]");
        input.value = link;
        delete input.dataset.update;
        delete input.dataset.shortened;
        shareDiv.querySelector(".tc-iframe input[type=text]").value = await shareCtl.generateIframe(link);
    },

    showShareDialog: function (divElement) {
        const dialogDiv = this.getDiv(divElement);
        const shareDialog = dialogDiv.querySelector('.' + this.CLASS + '-share-dialog');
        const openCallback = () => {
            this.onShowShareDialog().then(() => {
                this.map.trigger(Consts.event.DIALOG, { control: this._shareCtl, action: "share" });
            });
        };
        const closeCallback = () => {
            this.onCloseShareDialog();
        };
        if (shareDialog.tagName === 'DIALOG') {
            shareDialog.showModal();
            openCallback();
            shareDialog.onclose = closeCallback;
        }
        else {
            Util.showModal(shareDialog, {
                openCallback,
                closeCallback,
            });
        }
    },

    onCloseShareDialog: function () {
        this.toShare = this.toShare || {};
        this.toShare.doZoom = false;
        // para gestionar el zoom a la feature al compartir desde el control o el general, ya que la capa que contiene la feature no cambia por lo que no salta.
        this.map.trigger(Consts.event.MAPCHANGE);
    }

};

const infoShare = TC.control.infoShare;
export default infoShare;
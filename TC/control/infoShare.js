import TC from '../../TC';
import Util from '../Util';
import Consts from '../Consts';

TC.Util = Util;
TC.control = TC.control || {};

// Mixin
TC.control.infoShare = {

    getDiv: function (divElement) {
        const self = this;
        return divElement ? divElement : self._dialogDiv;
    },

    getShareDialog: async function (divElement) {
        const self = this;
        const dialogDiv = self.getDiv(divElement);
        if (!self._shareCtl) {
            self._shareCtl = await self.map.addControl('share', {
                id: self.getUID(),
                div: dialogDiv.querySelector('.tc-modal-body .' + self.CLASS + '-share-dialog-ctl'),
                includeControls: false
            });
            self._shareCtl.caller = self;
            self._shareCtl.extraParams = null;
        }
        return self._shareCtl;
    },

    onShowShareDialog: async function () {
        const self = this;
        self.toShare = self.toShare || {};
        self.toShare.doZoom = true;
        // para gestionar el zoom a la feature al compartir desde el control o el general, ya que la capa que contiene la feature no cambia por lo que no salta.
        self.map.trigger(Consts.event.MAPCHANGE);
        const shareCtl = self._shareCtl;
        const shareDiv = shareCtl.div;
        const link = await shareCtl.generateLink();
        const input = shareDiv.querySelector(".tc-url input[type=text]");
        input.value = link;
        delete input.dataset.update;
        delete input.dataset.shortened;
        shareDiv.querySelector(".tc-iframe input[type=text]").value = await shareCtl.generateIframe(link);
    },

    showShareDialog: function (divElement) {
        const self = this;
        const dialogDiv = self.getDiv(divElement);
        const shareDialog = dialogDiv.querySelector('.' + self.CLASS + '-share-dialog');
        TC.Util.showModal(shareDialog, {
            openCallback: function () {
                self.onShowShareDialog(shareDialog).then(function () {
                    self.map.trigger(Consts.event.DIALOG, { control: self._shareCtl, action: "share" });
                });
            },
            closeCallback: function () {
                self.onCloseShareDialog();
            }
        });
    },

    onCloseShareDialog: function () {
        const self = this;
        self.toShare = self.toShare || {};
        self.toShare.doZoom = false;
        // para gestionar el zoom a la feature al compartir desde el control o el general, ya que la capa que contiene la feature no cambia por lo que no salta.
        self.map.trigger(Consts.event.MAPCHANGE);
    }

};

const infoShare = TC.control.infoShare;
export default infoShare;
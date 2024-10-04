import TC from '../../TC';
import FeatureDownloadDialog from './FeatureDownloadDialog';

TC.control = TC.control || {};

class TrackDownloadDialog extends FeatureDownloadDialog {

    async loadTemplates() {
        await super.loadTemplates();
        const self = this;
        const module = await import('../templates/tc-ctl-geolocation-ext-dldlog.mjs');
        self.template = {
            [self.CLASS]: self.template,
            [self.CLASS + '-ext-dldlog']: module.default
        };
    }

    async open(featureOrFeatures, options) {
        await super.open(featureOrFeatures, options);
        const html = await this.getRenderedHtml(self.CLASS + '-ext-dldlog');
        const divToExtensions = this.modalBody.querySelector('.' + this.CLASS + "-ext");
        divToExtensions?.insertAdjacentHTML('beforend', html);
    }

    addUIEventListeners() {
        super.addUIEventListeners();
        if (this.modalBody) {
            this.modalBody.addEventListener('change', TC.EventTarget.listenerBySelector('input[type=radio][name$="-dldlog-source"]', function (_e) {

            }));
        }
    }
}

TC.control.TrackDownloadDialog = TrackDownloadDialog;
export default TrackDownloadDialog;
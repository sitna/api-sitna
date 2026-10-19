/**
 * @class LayerEvent
 * @memberof SITNA.layer
 * @param {string} type - Tipo de evento.
 * @param {object} options - Objeto de opciones del evento.
 * @param {SITNA.layer.Layer} options.layer - Capa que provoca que se lance el evento.
 * @param {string} [options.message] - Mensaje opcional que acompaña al evento, por ejemplo, si se ha producido un error al cargar la capa.
 * @property {string} type - Tipo de evento.
 * @property {SITNA.layer.Layer} layer - Capa que provoca que se lance el evento.
 * @property {string} [message] - Mensaje opcional que acompaña al evento, por ejemplo, si se ha producido un error al cargar la capa.
 * @see Eventos de {@link SITNA.Map}
 */

export default class LayerEvent extends Event {
    layer;
    newData;
    message;

    static type = {
        BASELAYERCHANGE: 'sitna:baselayerchange',
        LAYERADD: 'sitna:layeradd',
        LAYERERROR: 'sitna:layererror',
        LAYERREMOVE: 'sitna:layerremove',
        LAYERUPDATE: 'sitna:layerupdate',
    };

    constructor(type, options) {
        super(type, options);
        Object.assign(this, options);
    }
}
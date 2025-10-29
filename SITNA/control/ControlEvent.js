/** 
 * @class ControlEvent
 * @memberof SITNA.control
 * @param {string} type - Tipo de evento.
 * @param {object} options - Objeto de opciones del evento.
 * @param {MapControl} options.control - Control que provoca que se lance el evento.
 * @param {string} [options.message] - Mensaje opcional que acompaña al evento, por ejemplo, si el control ha lanzado un error.
 * @property {string} type - Tipo de evento.
 * @property {MapControl} control - Control que provoca que se lance el evento.
 * @property {string} [message] - Mensaje opcional que acompaña al evento, por ejemplo, si el control ha lanzado un error.
 * @see Eventos de {@link SITNA.Map}
 */
export default class ControlEvent extends Event {
    control;
    constructor(type, options) {
        super(type, options);
        Object.assign(this, options);
    }
}
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
        const allowedKeys = ['control', 'message'];
        const optionGroups = Object.groupBy(Object.entries(options), ([key]) => allowedKeys.includes(key) ? 'control' : 'super');
        const superOptions = Object.fromEntries(optionGroups.super || []);
        const controlEventOptions = Object.fromEntries(optionGroups.control || []);
        if (!Object.hasOwn(superOptions, 'bubbles')) superOptions.bubbles = true;
        super(type, superOptions);
        Object.assign(this, controlEventOptions);
    }
}
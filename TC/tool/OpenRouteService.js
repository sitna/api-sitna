import Util from '../Util.js'

class OpenRouteService {

    static preference = {
        RECOMMENDED: 'recommended',
        FASTEST: 'fastest',
        SHORTEST: 'shortest'
    };

    constructor(options = {}) {
        this.options = options;
        this.url = this.options.url;
        this.apiKey = this.options.apiKey || null;
        if (Util.isFunction(this.options.getRoute)) {
            this.getRoute = this.options.getRoute;
        }
        if (Util.isFunction(this.options.parseResponse)) {
            this.parseResponse = this.options.parseResponse;
        }
    }

    async init() {
        if (!this.status) {
            try {
                const response = await fetch(`${this.url}/status`);
                if (response.ok) {
                    this.status = await response.json();
                }
                else {
                    throw Error('Error connecting to OpenRouteService API');
                }
            }
            catch (error) {
                throw Error('Error connecting to OpenRouteService API: ' + error.message);
            }
        }
    }

    async getProfiles() {
        try {
            await this.init();
            return Object.values(this.status.profiles).map((profile) => profile.encoder_name ?? profile.profiles);
        }
        catch(error) {
            return [];
        }
    }

    async getLanguage(preference = 'en-US') {
        await this.init();
        let code = preference.toLowerCase() ;
        if (this.status.languages.includes(code)) {
            return code;
        }
        const [lang, region] = code.split('-');
        if (this.status.languages.includes(lang)) {
            return lang;
        }
        const byRegion = this.status.languages.find((l) => l.endsWith(`-${region}`));
        if (byRegion) {
            return byRegion;
        }
        return 'en-us';
    }

    async getRoute(options = {}) {
        await this.init();
        const payload = {};
        payload.coordinates = options.coordinates || [];
        payload.language = await this.getLanguage(options.locale);
        if (options.preference) payload.preference = options.preference;
        if (!options.avoidAlternatives && this.options.alternativeRoutes && payload.coordinates.length < 3) {
            payload.alternative_routes = {
                target_count: this.options.alternativeRoutes.targetCount ?? 1,
            };
            if (this.options.alternativeRoutes.shareFactor) payload.alternative_routes.share_factor = this.options.alternativeRoutes.shareFactor;
            if (this.options.alternativeRoutes.weightFactor) payload.alternative_routes.weight_factor = this.options.alternativeRoutes.weightFactor;
        }
        if (this.options.elevation) {
            payload.elevation = true;
        }
        const profile = options.profile || await this.getProfiles()[0];
        const url = options.url ?? this.url;
        const apiKey = options.apiKey || this.apiKey;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey) headers['Authorization'] = apiKey;
        const response = await fetch(`${this.#getDirectionsUrl(url)}/${profile}/geojson`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        
        const responseObject = await response.json();
        if (response.ok) {
            return responseObject;
        }
        else {
            let message = 'route.error.unknown';
            switch (responseObject.error.code) {
                case 2001:
                    message = 'route.error.missingParameter';
                    break;
                case 2002:
                    message = 'route.error.invalidParameterFormat';
                    break;
                case 2003:
                    message = 'route.error.invalidParameterValue';
                    break;
                case 2004:
                    message = 'route.error.limitExceeded';
                    break;
                case 2009:
                    message = 'route.error.routeNotFound';
                    break;
                case 2010: {
                    // Este es el código que se lanza cuando intentamos acceder a una zona geográfica 
                    // fuera de la cubierta por GN, por eso vamos al fallback.
                    message = 'route.error.pointNotFound';
                    const fallbackResult = await this.#getFallbackRoute(options);
                    if (fallbackResult) return fallbackResult;
                    break;
                }
            }
            if (!options.avoidAlternatives) {
                const newOptions = { ...options, avoidAlternatives: true };
                return await this.getRoute(newOptions);
            }
            throw Error(message);
        }
    }

    parseResponse(response) {
        return response;
    }

    async #getFallbackRoute(options = {}) {
        if (this.options.fallbackUrl && this.options.fallbackUrl !== options.url) {
            const fallbackOptions = {
                ...options,
                url: this.options.fallbackUrl,
                apiKey: this.options.fallbackApiKey,
            };
            return await this.getRoute(fallbackOptions);
        }
        return false;
    }

    #getDirectionsUrl(url) {
        if (url.endsWith("directions")) return url;
        else if (url.endsWith("/")) return url + "directions";
        else return url + "/directions";
    }
}

export default OpenRouteService;
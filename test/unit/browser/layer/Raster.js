
var expect = chai.expect;

// only critical error messages
$.mockjaxSettings.logging = 0;

describe('Tests de TC.layer.Raster', function () {

    TC.isDebug = false;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    var toCheck = [
        { url: "https://servicio_CORS_HTTPS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
        { url: "https://servicio_NOCORS_HTTPS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 1 },
        { url: "http://servicio_NOCORS_NOHTTPS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://servicio_NOCORS_NOHTTPS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 0 },
        { url: "http://servicio_CORS_NOHTTPS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://servicio_CORS_NOHTTPS?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 0 }
    ];

    function mockResult(serviceWorker, location, cors, https) {
        var byProxy = { metodo: TC.layer.Raster.prototype.getByProxy_, name: "TC.layer.Raster.prototype.getByProxy_", statusCode: { status: 500 } };

        if (serviceWorker) {
            if (!https || !cors) {
                return byProxy;
            }
        }

        if (!cors) { return byProxy; }

        if (location.indexOf("https") > -1 && !https) {
            //if (!cors) {
            return byProxy;
            /*} else {
                return { metodo: TC.layer.Raster.prototype.getBySSL_, name: "TC.layer.Raster.prototype.getBySSL_", statusCode: { status: 500 } };
            }*/
        }

        if (location.indexOf("https") > -1 && !https && cors) {
            return byProxy;
        }

        return { metodo: TC.layer.Raster.prototype.getByUrl_, name: "TC.layer.Raster.prototype.getByUrl_", statusCode: { status: 200 } };
    }

    describe('Enumeraciones, propiedades y funciones internas de OL que usamos en la optimización de la validación de CORS siguen disponibles', function () {
        it("Enum ol.ImageState sigue disponible", function (done) {
            
            expect(ol.ImageState.LOADED).to.equal(2);

            done();
        });

        it("Propiedad interna image_ sigue disponible", function (done) {

            var olImage = new ol.Image();
            expect(olImage.image_).to.not.equal(undefined);

            done();
        });

        it("Función changed sigue disponible", function (done) {

            var olImage = new ol.Image();
            expect($.isFunction(olImage.changed)).to.be.true;

            done();
        });
    });
    
    describe('getLegendUrl', function () {

        it("Debe modificar a HTTPS cuando el servicio lo es y la leyenda es HTTP", function (done) {

            TC.layer.Raster.prototype.url = "https://laurldelservicioessegura";

            expect(TC.layer.Raster.prototype.getLegendUrl("http://estoesungetlegend", "https://")).to.equal("https://estoesungetlegend");

            done();
        });

        it("Con serviceworker y servicio sin CORS: la url debe ser directa", function (done) {

            var isServiceWorkerFN = TC.Util.isServiceWorker;
            TC.Util.isServiceWorker = function () { return true };
            TC.layer.Raster.prototype.capabilitiesUrl_ = TC.layer.Raster.prototype.getByProxy_;
            TC.layer.Raster.prototype.url = "https://laurldelservicioessegura";

            var result = TC.layer.Raster.prototype.getLegendUrl("http://estoesungetlegend", "https://");
            console.log(result);
            expect(result).to.equal("https://estoesungetlegend");

            TC.Util.isServiceWorker = isServiceWorkerFN;

            done();
        });
    });


    describe('imageLoadingError_', function () {

        it("Debe establecer getUrl a getByProxy_", function (done) {
            var image = new ol.Image();
            TC.layer.Raster.prototype.imageLoadingError_(image, "blob", function () { });

            expect(TC.layer.Raster.prototype.getUrl.toString()).to.equal(TC.layer.Raster.prototype.getByProxy_.toString());

            done();
        });
    });

    describe('imageLoadedBlob_', function () {

        it("Con status 200 y excepción en el cuerpo de respuesta debe cargar TC.Consts.BLANK_IMAGE", function (done) {

            var xhr = {
                response: {
                    type: 'xml'
                }
            };
            var image = new ol.Image();
            TC.layer.Raster.prototype.imageLoadedBlob_(xhr, image);

            expect(image.getImage().src).to.equal(TC.Consts.BLANK_IMAGE);

            done();
        });

        it("Con status >= 400 y status <= 500 debe cargar TC.Consts.BLANK_IMAGE", function (done) {

            var xhr = {
                status: 500
            };
            var image = new ol.Image();
            TC.layer.Raster.prototype.imageLoadedBlob_(xhr, image);

            expect(image.getImage().src).to.equal(TC.Consts.BLANK_IMAGE);

            done();
        });

        // GLS: debería validar si muestra tostada, pero no sé cómo
        //it("Con status 401 debe lanzar un evento TC.Consts.event.TILELOADERROR", function (done) {

        //    var xhr = {
        //        status: 401
        //    };
        //    var image = new ol.Image();
        //    TC.layer.Raster.prototype.imageLoadedBlob_(xhr, image);            

        //    done();
        //});        
    });

    describe('imageLoad_blank_', function () {
        $.mockjax.clear();

        it("Debe cargar TC.Consts.BLANK_IMAGE", function (done) {

            var mockOptions = {
                url: TC.Consts.BLANK_IMAGE + '&' + TC.getUID()
            };
            $.extend(mockOptions, { status: 200 });

            $.mockjax(mockOptions);

            var image = new ol.Image();
            TC.layer.Raster.prototype.imageLoad_blank_(image);

            expect(image.getImage().src).to.equal(TC.Consts.BLANK_IMAGE);

            $.mockjax.clear(mockOptions.url);

            done();
        });
    });

    
    it('getByProxy_: el resultado contiene el valor de TC.Cfg.proxy', function () {
        expect(TC.layer.Raster.prototype.getByProxy_("https://gls/prueba")).to.include(TC.Cfg.proxy);
    });

    it('getBySSL_: de "http://gls/prueba" a "https://gls/prueba"', function () {
        expect(TC.layer.Raster.prototype.getBySSL_("http://gls/prueba")).to.equal("https://gls/prueba");
    });

    it('getByUrl_: de "https://gls/prueba" a "https://gls/prueba"', function () {
        expect(TC.layer.Raster.prototype.getBySSL_("https://gls/prueba")).to.equal("https://gls/prueba");
    });


    describe('getCapabilitiesUrl_ServiceWorker_', function () {

        //toCheck.forEach(function (service) {
        //    var mock = mockResult(1, "https://", service.CORS, service.HTTPS);
        //    it("Servicio CORS: " + service.CORS + ' HTTPS: ' + service.HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

        //        var mockOptions = {
        //            url: service.urlMock || service.url
        //        };
        //        $.extend(mockOptions, mock.statusCode);

        //        $.mockjax(mockOptions);

        //        TC.layer.Raster.prototype.getCapabilitiesUrl_ServiceWorker_(service.url);
        //        TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
        //            expect(TC.layer.Raster.prototype.getCapabilitiesUrl_().toString()).to.equal(mock.metodo.toString());
        //        }).then(done);
        //    });
        //});

        var mock = mockResult(1, "https://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.getCapabilitiesUrl_ServiceWorker_(toCheck[0].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


        mock = mockResult(1, "https://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.getCapabilitiesUrl_ServiceWorker_(toCheck[1].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


        mock = mockResult(1, "https://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].urlMock
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.getCapabilitiesUrl_ServiceWorker_(toCheck[2].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


        mock = mockResult(1, "https://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].urlMock
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.getCapabilitiesUrl_ServiceWorker_(toCheck[3].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

    });

    describe('getCapabilitiesUrl_MixedContent_FromHTTPS_', function () {
        /*
        var mock = mockResult(0, "https://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].urlMock
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTPS_(toCheck[0].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].urlMock
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTPS_(toCheck[1].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });
        */
        var mock = mockResult(0, "https://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].urlMock
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTPS_(toCheck[2].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


        mock = mockResult(0, "https://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].urlMock
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTPS_(toCheck[3].url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });
    });

    describe('getCapabilitiesUrl_MixedContent_FromHTTP_', function () {
        $.mockjax.clear();

        var mock = mockResult(0, "http://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTP_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


        mock = mockResult(0, "http://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTP_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });
    });

    describe('getCapabilitiesUrl_MixedContent_', function () {
        $.mockjax.clear();

        var mock = mockResult(0, "https://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTP_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTP_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTP_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_MixedContent_FromHTTP_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


    });

    describe('getCapabilitiesUrl_ProtocolSiblings_', function () {
        $.mockjax.clear();

        var mock = mockResult(0, "https://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_ProtocolSiblings_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_ProtocolSiblings_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].url + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_ProtocolSiblings_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_ProtocolSiblings_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

    });

    describe('getCapabilitiesUrl_CORSSupport_', function () {
        $.mockjax.clear();

        var mock = mockResult(0, "https://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_CORSSupport_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_CORSSupport_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].url + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_CORSSupport_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.getCapabilitiesUrl_CORSSupport_(mockOptions.url);
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

    });

    describe('setCapabilitiesUrl_', function () {
        $.mockjax.clear();

        var mock = mockResult(0, "http://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "http://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "http://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].url + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "http://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "http://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("location.href: " + "http:// " + "Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "http://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });


        mock = mockResult(0, "https://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].url + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("location.href: " + "https:// " + "Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        var isServiceWorkerFN = TC.Util.isServiceWorker;
        TC.Util.isServiceWorker = function () { return true };

        mock = mockResult(0, "https://", toCheck[0].CORS, toCheck[0].HTTPS);
        it("ServiceWorker: 1 location.href: " + "https:// " + "Servicio CORS: " + toCheck[0].CORS + ' HTTPS: ' + toCheck[0].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[0].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[1].CORS, toCheck[1].HTTPS);
        it("ServiceWorker: 1 location.href: " + "https:// " + "Servicio CORS: " + toCheck[1].CORS + ' HTTPS: ' + toCheck[1].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[1].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[2].CORS, toCheck[2].HTTPS);
        it("ServiceWorker: 1 location.href: " + "https:// " + "Servicio CORS: " + toCheck[2].CORS + ' HTTPS: ' + toCheck[2].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[2].url + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);
            }).then(done);
        });

        mock = mockResult(0, "https://", toCheck[3].CORS, toCheck[3].HTTPS);
        it("ServiceWorker: 1 location.href: " + "https:// " + "Servicio CORS: " + toCheck[3].CORS + ' HTTPS: ' + toCheck[3].HTTPS + ' método de carga debe ser ' + mock.name, function (done) {

            var mockOptions = {
                url: toCheck[3].url + '&' + TC.getUID()
            };
            $.extend(mockOptions, mock.statusCode);

            $.mockjax(mockOptions);

            TC.layer.Raster.prototype.capabilitiesUrl_promise_ = null;
            TC.layer.Raster.prototype.setCapabilitiesUrl_(mockOptions.url, function () { }, function () { }, "https://");
            TC.layer.Raster.prototype.getCapabilitiesUrl_promise_().then(function () {
                expect(TC.layer.Raster.prototype.capabilitiesUrl_.toString()).to.equal(mock.metodo.toString());

                $.mockjax.clear(mockOptions.url);

                TC.Util.isServiceWorker = isServiceWorkerFN;
            }).then(done);
        });
    });

});



//var toCheck = [
//       // mapas de fondo
//       { url: "https://idena.navarra.es/ogc/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wmts/mapa-raster?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wmts/ign-base?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wmts/mdt?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://idena.navarra.es/ogc/inspire/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       // wms externos estatales
//       { url: "https://www.ign.es/wms-inspire/ign-base?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/redes-geodesicas?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/cuadriculas?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/unidades-administrativas?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/ocupacion-suelo?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 1 },
//       { url: "http://www.cartociudad.es/wms/CARTOCIUDAD/CARTOCIUDAD?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://www.cartociudad.es/wms/CARTOCIUDAD/CARTOCIUDAD?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 0 },
//       { url: "https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/mapa-raster?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "http://wms.magrama.es/wms/wms.aspx?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://wms.magrama.es/wms/wms.aspx?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 0 },
//       { url: "https://www.ign.es/wms-inspire/pnoa-ma?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms/pnoa-historico?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/camino-santiago?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/geofisica?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "https://www.ign.es/wms-inspire/mdt?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 1, HTTPS: 1 },
//       { url: "http://ideadif.adif.es/gservices/Tramificacion/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://ideadif.adif.es/gservices/Tramificacion/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 0 },
//       { url: "http://servicios.internet.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://servicios.internet.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 0 },
//       // wms externos comunidades limítrofes
//       { url: "http://idearagon.aragon.es/Visor2D?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://idearagon.aragon.es/Visor2D?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 0 },
//       { url: "https://ogc.larioja.org/wms/request.php?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 1 },
//       { url: "http://www.geo.euskadi.eus/WMS_KARTOGRAFIA?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", urlMock: "https://www.geo.euskadi.eus/WMS_KARTOGRAFIA?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities", CORS: 0, HTTPS: 0 }
//];
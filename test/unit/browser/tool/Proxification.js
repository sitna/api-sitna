

console.log('LLega a los tests de proxification');


var expect = chai.expect;

// only critical error messages
$.mockjaxSettings.logging = 0;

before(function (done) {
    if (!navigator.serviceWorker.controller) {
        navigator.serviceWorker.register('service-worker-tool-proxification-mocking.js')
           .then(function(registration) {               
               window.location.reload();               
           }).then(done);
    }
    else {         
        done();
    }   
});

describe('Tests de TC.tool.Proxification', function () {
    var self = this;

    if (!TC.Cfg.proxy) {
        TC.Cfg.proxy = "proxy/proxy.ashx?";
    }

    var toolProxification = new TC.tool.Proxification(TC.Cfg.proxy, { allowedMixedContent: true });

    describe('GetImage', function () {        

        var original_isServiceWorker = toolProxification._isServiceWorker;
        toolProxification._isServiceWorker = function () { return false; };

        describe('Location HTTP', function(){
                
            toolProxification._isServiceWorker = function () { return false; };

            it("1. location HTTP Imagen en HTTP sin CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host1imagen_sin_cors/?http=200&image=image.jpg";                    
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src).then(function (img) {
                        
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("2. location HTTP Imagen en HTTP sin CORS y exportable", function (done) { 
                this.timeout(8000);

                var src = "http://host2imagen_sin_cors_y_exportable/?http=500&https=500&proxy=200&image=image.jpg";                    
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("3. location HTTP Imagen en HTTP con CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host3imagen_con_cors/?http=200&image=image.jpg";
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src).then(function (img) {                        
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("4. location HTTP Imagen en HTTP con CORS y exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host4imagen_con_cors_y_exportable/?http=200&image=image.jpg";                    
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {                        
                    expect(src).to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });

            it("5. location HTTP Imagen en HTTPS sin CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host5imagen_sin_cors/?https=200&image=image.jpg";                    
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src).then(function (img) {
                        
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("6. location HTTP Imagen en HTTPS sin CORS y exportable", function (done) { 
                this.timeout(8000);

                var src = "https://host6imagen_sin_cors_y_exportable/?https=500&http=500&proxy=200&image=image.jpg";                    
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });
            
            it("7. location HTTP Imagen en HTTPS con CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host7imagen_con_cors/?https=200&image=image.jpg";
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src).then(function (img) {                        
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });

            it("8. location HTTP Imagen en HTTPS con CORS y exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host8imagen_con_cors_y_exportable/?https=200&image=image.jpg";                    
                toolProxification._location = 'http://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {                        
                    expect(src).to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });
        });            
        describe('Location HTTPS', function(){
            it("1. location HTTPS Imagen en HTTP sin CORS y NO exportable", function (done) { 
                this.timeout(8000);

                var src = "http://host9imagen_sin_cors/?http=200&image=image.jpg";                    
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src).then(function (img) {
                    
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("2. location HTTPS con prevención de contenido mixto activado Imagen en HTTP sin CORS y NO exportable con HTTPS disponible", function (done) { 
                this.timeout(8000);

                var tool = new TC.tool.Proxification(TC.Cfg.proxy, { allowedMixedContent: false });
                var src = "http://host10imagen_sin_cors/?https=200&image=image.jpg";
                tool._location = 'https://mi_sitio';                    

                tool.getImage(src).then(function (img) {                    
                    expect("https://host10imagen_sin_cors/?https=200&image=image.jpg").to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("3. location HTTPS con prevención de contenido mixto activado Imagen en HTTP sin CORS y NO exportable sin HTTPS disponible", function (done) { 
                this.timeout(5000);

                var tool = new TC.tool.Proxification(TC.Cfg.proxy, { allowedMixedContent: false });
                var src = "http://host12imagen_sin_cors/?https=500&proxy=200&image=image.jpg";
                tool._location = 'https://mi_sitio';                    

                tool.getImage(src).then(function (img) {                    
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });            

            it("4. location HTTPS Imagen en HTTP sin CORS y exportable", function (done) { 
                this.timeout(8000);

                var src = "http://host13imagen_sin_cors/?http=500&https=500&proxy=200&image=image.jpg";                    
                toolProxification._location = 'https://mi_sitio';                    
                toolProxification.getImage(src, true).then(function (img) {
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("5. location HTTPS Imagen en HTTP con CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host14imagen_con_cors/?http=200&image=image.jpg";
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src).then(function (img) {                        
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("6. location HTTPS Imagen en HTTP con CORS y exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host15imagen_con_cors/?http=200&image=image.jpg";                    
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {                        
                    expect(src).to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });   

            it("7. location HTTPS Imagen en HTTPS sin CORS y NO exportable", function (done) { 
                this.timeout(8000);

                var src = "https://host16imagen_sin_cors/?https=200&image=image.jpg";                    
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src).then(function (img) {
                    
                    expect(src).to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("8. location HTTPS Imagen en HTTPS sin CORS y exportable", function (done) { 
                this.timeout(8000);

                var src = "https://host17imagen_sin_cors/?https=500&http=500&proxy=200&image=image.jpg";
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("9. location HTTPS Imagen en HTTPS con CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host18imagen_con_cors/?https=200&image=image.jpg";
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src).then(function (img) {                        
                    expect(src).to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("10. location HTTPS Imagen en HTTPS con CORS y exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host19imagen_con_cors/?https=200&image=image.jpg";                    
                toolProxification._location = 'https://mi_sitio';
                toolProxification.getImage(src, true).then(function (img) {                        
                    expect(src).to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });  
        });        
        describe('Location con SW', function(){
            var SWtoolProxification = new TC.tool.Proxification(TC.Cfg.proxy);
            SWtoolProxification._isServiceWorker = function () { return false; };

            it("location HTTPS con SW Imagen en HTTP sin CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host20imagen_sin_cors/?https=500&proxy=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src).then(function (img) {
                    
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTP sin CORS y NO exportable con HTTPS disponible", function (done) { 
                this.timeout(5000);

                var src = "http://host21imagen_sin_cors/?https=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src).then(function (img) {                    
                    expect("https://host21imagen_sin_cors/?https=200&image=image.jpg").to.equal(img.src);                        
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTP sin CORS y exportable", function (done) { 
                this.timeout(8000);

                var src = "http://host22imagen_sin_cors/?http=500&https=500&proxy=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src, true).then(function (img) {
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTP con CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host23imagen_con_cors/?http=500&https=500&proxy=200&image=image.jpg";
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src).then(function (img) {                        
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTP con CORS y exportable", function (done) { 
                this.timeout(5000);

                var src = "http://host24imagen_con_cors/?http=500&https=500&proxy=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src, true).then(function (img) {                        
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTP con CORS y exportable con HTTPS disponible", function (done) { 
                this.timeout(8000);

                var src = "http://host25imagen_con_cors/?http=500&https=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src, true).then(function (img) {                        
                    expect("https://host25imagen_con_cors/?http=500&https=200&image=image.jpg").to.equal(img.src);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });


            it("location HTTPS con SW Imagen en HTTPS sin CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host26imagen_sin_cors/?https=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src).then(function (img) {
                    
                    expect(img.src).to.equal(src);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTPS sin CORS y exportable", function (done) { 
                this.timeout(8000);

                var src = "https://host27imagen_sin_cors/?https=500&proxy=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src, true).then(function (img) {
                    expect(img.src).to.include(TC.Cfg.proxy);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTPS con CORS y NO exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host28imagen_con_cors/?https=200&image=image.jpg";
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src).then(function (img) {                        
                    expect(img.src).to.equal(src);
                }, function (error) {
                    expect(false).to.be.true;                        
                }).then(done);
            });

            it("location HTTPS con SW Imagen en HTTPS con CORS y exportable", function (done) { 
                this.timeout(5000);

                var src = "https://host29imagen_con_cors/?https=200&image=image.jpg";                    
                SWtoolProxification._location = 'https://mi_sitio';
                SWtoolProxification.getImage(src, true).then(function (img) {                        
                    expect(img.src).to.equal(src);
                }, function (error) {
                    expect(false).to.be.true;
                }).then(done);
            });
        });            
    });   

    describe('Instanciación de la herramienta', function () {
        it("Lanza excepción indicando el error", function (done) {
            expect(function () { return new TC.tool.Proxification(); }).to.throw();
            done();
        });

        it("Por defecto 'preventMixedContent' es true", function (done) {
            expect(new TC.tool.Proxification(TC.Cfg.proxy).preventMixedContent).to.be.true;
            done();
        });
    });

    describe('Funciones utilidades', function () {        
        it("_isServiceWorker valida que no hay service worker activo", function (done) {            
            expect(toolProxification._isServiceWorker()).to.be.false;
            done();
        });

        it("_isServiceWorker detecta service worker activo", function (done) {
            
            Object.defineProperty(window.navigator, 'serviceWorker', {
                get: function() {
                    return {
                        controller: {
                            state: "activated"
                        }
                    };
                }
            });

            expect(new TC.tool.Proxification(TC.Cfg.proxy)._isServiceWorker()).to.be.true;
            done();
        });
    });    
});

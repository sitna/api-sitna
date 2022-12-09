describe('Tests de TC.Util', function () {
    describe('getMapLocale', function () {
        it('sin locale deberia devolver es-ES', function () {
            expect(TC.Util.getMapLocale({})).to.equal('es-ES');
        });
    });

    const epsg25830 = 'EPSG:25830';
    const epsg4326 = 'EPSG:4326';
    const urn25830 = 'urn:ogc:def:crs:EPSG::25830';
    const urn25830v2 = 'urn:ogc:def:crs:EPSG:2:25830';
    const gml25830 = 'http://www.opengis.net/gml/srs/epsg.xml#25830';
    const relativeUrl = '/navegar/default.aspx';
    const relativeFolderUrl = '/navegar/';
    const absoluteUrl = 'https://idena.navarra.es/navegar/default.aspx';
    const absoluteFolderUrl = 'https://idena.navarra.es/navegar/';
    const parameterName = "test";
    const parameterValue = "1"
    const parameter = { [parameterName]: parameterValue };
    const currentUrl = new URL(window.location.href);
    const currentPath = currentUrl.href.substr(currentUrl.href.indexOf(currentUrl.host) + currentUrl.host.length);
    const currentBase = currentPath.substr(0, currentPath.lastIndexOf(':') + 1);

    describe('CRSCodesEqual', function () {
        it('con dos CRS iguales deberia devolver true', function () {
            expect(TC.Util.CRSCodesEqual(epsg25830, epsg25830)).to.be.true;
        });
        it('con dos CRS distintos deberia devolver false', function () {
            expect(TC.Util.CRSCodesEqual(epsg25830, epsg4326)).to.be.false;
        });
        it('con dos CRS equivalentes deberia devolver true', function () {
            expect(TC.Util.CRSCodesEqual(epsg25830, urn25830)).to.be.true;
            expect(TC.Util.CRSCodesEqual(urn25830, epsg25830)).to.be.true;
            expect(TC.Util.CRSCodesEqual(urn25830v2, epsg25830)).to.be.true;
        });
    });

    describe('getCRSCode', function () {
        it('algo que no sea un CRS válido devuelve null', function () {
            expect(TC.Util.getCRSCode("voyafallar:2020")).to.be.null;
        });
        it('un código en formato EPSG devuelve su valor', function () {
            expect(TC.Util.getCRSCode(epsg25830)).to.equal('25830');
        });
        it('un código en formato URN sin versión devuelve su valor', function () {
            expect(TC.Util.getCRSCode(urn25830)).to.equal('25830');
        });
        it('un código en formato URN con versión devuelve su valor', function () {
            expect(TC.Util.getCRSCode(urn25830v2)).to.equal('25830');
        });
        it('un código en formato GML devuelve su valor', function () {
            expect(TC.Util.getCRSCode(gml25830)).to.equal('25830');
        });
    });

    describe('addURLParameters', function () {
        it('si no se pasan parámetros se devuelve la misma URL', function () {
            expect(TC.Util.addURLParameters(relativeUrl)).to.equal(relativeUrl);
            expect(TC.Util.addURLParameters(relativeFolderUrl)).to.equal(relativeFolderUrl);
            expect(TC.Util.addURLParameters(absoluteUrl)).to.equal(absoluteUrl);
            expect(TC.Util.addURLParameters(absoluteFolderUrl)).to.equal(absoluteFolderUrl);
        });
        it('Si se pasa un parámetro se devuelve la URL con parámetro', function () {
            expect(TC.Util.addURLParameters(relativeUrl, parameter)).to.equal(`${currentBase}${relativeUrl}?${parameterName}=${parameterValue}`);
            expect(TC.Util.addURLParameters(relativeFolderUrl, parameter)).to.equal(`${currentBase}${relativeFolderUrl}?${parameterName}=${parameterValue}`);
            expect(TC.Util.addURLParameters(absoluteUrl, parameter)).to.equal(`${absoluteUrl}?${parameterName}=${parameterValue}`);
            expect(TC.Util.addURLParameters(absoluteFolderUrl, parameter)).to.equal(`${absoluteFolderUrl}?${parameterName}=${parameterValue}`);
        });
        it('Si se pasa un parámetro que ya existe no se añade', function () {
            expect(TC.Util.addURLParameters(`${relativeUrl}?${parameterName}=${parameterValue}`, parameter)).to.equal(`${currentBase}${relativeUrl}?${parameterName}=${parameterValue}`);
            expect(TC.Util.addURLParameters(`${relativeFolderUrl}?${parameterName}=${parameterValue}`, parameter)).to.equal(`${currentBase}${relativeFolderUrl}?${parameterName}=${parameterValue}`);
            expect(TC.Util.addURLParameters(`${absoluteUrl}?${parameterName}=${parameterValue}`, parameter)).to.equal(`${absoluteUrl}?${parameterName}=${parameterValue}`);
            expect(TC.Util.addURLParameters(`${absoluteFolderUrl}?${parameterName}=${parameterValue}`, parameter)).to.equal(`${absoluteFolderUrl}?${parameterName}=${parameterValue}`);
        });
    });
});
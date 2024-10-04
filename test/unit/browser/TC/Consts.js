describe('Tests de TC.Consts', function () {
    const expectAllProperties = (obj) => {
        for (const value of Object.values(obj)) {
            expect(value).to.not.be.undefined;
            if (value && typeof value === 'object') {
                expectAllProperties(value);
            }
        }
    };

    it('Todas las propiedades deben tener un valor no indefinido', function () {
        expectAllProperties(TC.Consts);
    });
});
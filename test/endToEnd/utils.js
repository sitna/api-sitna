exports.capture = function (screenshotName) {
    casper.then(function () {
        var testFile = this.test.currentSuite.file;
        if (testFile.indexOf('\\') != -1) {
            testFile = testFile.substring(testFile.lastIndexOf('\\') + 1);
        }
        testFile = testFile.replace('.js', '');

        var testName = this.test.currentSuite.name;

        var screenshotFile = 'screenshots/' + testFile + '/' + testName
                   + '/' + screenshotName + '.png';
        this.capture(screenshotFile);
    });
};
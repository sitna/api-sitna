$(function () {

    var size = TC.Util.getParameterByName("size");
    var orientation = TC.Util.getParameterByName("orientation");
    var title = TC.Util.getParameterByName("title");

    $("body").addClass("tc-print-" + orientation + "-" + size);
    document.querySelector('style').textContent += "@media print { @page {size: " + size + " " + orientation + "; margin: 10mm 10mm 10mm 10mm;}}";

    if (title) {
        window.document.title = title;
    }
    TC.loadJS(
            !window.dust,
            [TC.url.dustCore, TC.url.dustHelpers, TC.url.templating],
            function () {
                var src = $('#print-preview-controls').html();
                var compiled = dust.compile(src, 'print');
                dust.loadSource(compiled);

                dust.render('print', { Name: title }, function (err, out) {
                    $('#print-preview-controls').html(out);

                })

            });

    //Cuando se cierre el alert, se lanza la impresión
    $(".tc-button").on("click", function () {
        var iev = TC.Util.detectIE();
        if (iev) {
            $("head script").remove();
            printpr();
        }
        else {
            window.print();
        }
    });
});

function doPrint() {
    TC.Util.showModal('#printMessage');
	
}

function printpr() {
    try {
        /* OLECMDID values:    * 6 - print    * 7 - print preview    * 1 - open window    * 4 - Save As    */
        var OLECMDID = 7;
        var PROMPT = 1; // 2 DONTPROMPTUSER
        var WebBrowser = '<OBJECT ID="WebBrowser1" WIDTH=0 HEIGHT=0 CLASSID="CLSID:8856F961-340A-11D0-A96B-00C04FD705A2"></OBJECT>';
        document.body.insertAdjacentHTML('beforeEnd', WebBrowser);
        WebBrowser1.ExecWB(OLECMDID, PROMPT);
        WebBrowser1.outerHTML = "";
    }
    catch (ex) {
        window.print();
    }

    return false;
}
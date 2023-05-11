$(function () {

    var size = TC.Util.getParameterByName("size");
    var orientation = TC.Util.getParameterByName("orientation");
    var title = TC.Util.getParameterByName("title");

    $("body").addClass("tc-print-" + orientation + "-" + size);

    if ($('head > style').length === 0) {
        $("head").append('<style></style>');
    }

    document.querySelector('style').textContent += "@media print { @page {size: " + size + " " + orientation + "; margin: 10mm 10mm 10mm 10mm;}}";

    if (title) {
        window.document.title = title;
    }
});
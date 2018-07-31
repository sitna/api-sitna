(function () {

    const $pre = $('<pre>')
        .addClass('prettyprint')
        .attr('id', 'view-source')

    const a = document.createElement('a');
    a.id = "close-source";

    const viewSource = function () {
        if (!$pre.html()) {
            $.get(location.href).then(function (html) {
                $pre
                    .html(html.replace(/[<>]/g, function (m) { return { '<': '&lt;', '>': '&gt;' }[m] }))
                    .appendTo('body')
                    .fadeIn('fast');
                $hsLink
                    .appendTo('body')
                    .fadeIn('fast');
                TC.loadJS(!window.PR,
                    '../doc/assets/vendor/prettify/prettify-min.js',
                    function () {
                        TC.loadCSS('../doc/assets/vendor/prettify/prettify-min.css');
                        PR.prettyPrint();
                    }
                );
            })
        }
        else {
            $pre.fadeIn('fast');
            $hsLink.fadeIn('fast');
        }

        var sourceTimer = setInterval(function () {
            if (window.location.hash != '#view-source') {
                clearInterval(sourceTimer);
                document.body.className = '';
            }
        }, 200);
    };

    const $vsLink = $('<a>')
        .html('Ver código fuente')
        .attr('href', '#view-source')
        .addClass('view-source-link')
        .on('click', function (e) {
            e.stopPropagation();
            viewSource();
        });

    const $closeBtn = $('<button>')
        .html('\u2716')
        .addClass('close-btn')
        .on('click', function (e) {
            $(this).parents('.instructions').fadeOut('fast');
        });

    const $hsLink = $('<a>')
        .html('Ocultar código fuente')
        .attr('href', '#')
        .attr('id', 'hide-source-link')
        .on('click', function (e) {
            $pre.fadeOut('fast');
            $hsLink.fadeOut('fast');
        });

    $('.instructions')
        .first()
        .append($vsLink)
        .append($closeBtn);

    $(function () {
        if (location.hash === '#view-source') {
            viewSource();
        }
    });

})();
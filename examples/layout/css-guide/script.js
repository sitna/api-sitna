$(function () {
    const $pre = $('#src-section pre').addClass('prettyprint lang-html');
    const $articles = $('.style-demo-article');
    var $selectedArticle = $();

    const $selector = $('#selector select');
    $selector.on('change', function () {
        const value = $selector.val();
        $articles.hide();
        if (value) {
            $selectedArticle = $articles
                .find('#' + value)
                .parents('.style-demo-article')
                .first()
        }
        else {
            $selectedArticle = $articles.first();
        }
        $selectedArticle.show();

        render($selectedArticle);
        explain(value);
    });

    var prevHtml = '';
    const render = function ($article) {
        const $container = $article.find('.style-demo-container');
        const curHtml = $container.html();
        if (curHtml) {
            if (prevHtml !== curHtml) {
                $pre.html(html_beautify(curHtml, { indent_size: 4 }).replace(/[<>]/g, function (m) { return { '<': '&lt;', '>': '&gt;' }[m] }));
                $pre.removeClass('prettyprinted');
                prevHtml = curHtml;
            }
        }
        else {
            $pre.html('');
            prevHtml = '';
        }
    };

    $explanations = $('#explanation-section article');
    const explain = function (id) {
        $explanations.hide();
        $explanations.filter('#art-' + id).show();
    };

    TC.loadJS(!window.PR,
        '../doc/assets/vendor/prettify/prettify-min.js',
        function () {
            TC.loadCSS('../doc/assets/vendor/prettify/prettify-min.css');
            setInterval(function () {
                if ($selectedArticle.length) {
                    render($selectedArticle);
                }
                PR.prettyPrint();
            }, 200);
        }
    );
});
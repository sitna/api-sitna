document.querySelectorAll('.tc-map').forEach(function (elm) {
    const map = TC.Map.get(elm);

    if (map && !map._layoutDone) {
        map.ready(function () {

            const pre = document.querySelector('#src-section pre');
            pre.classList.add('prettyprint', 'lang-html');
            const articles = document.querySelectorAll('.style-demo-article');
            var selectedArticle;

            const selector = document.querySelector('#selector select');
            selector.addEventListener('change', function () {
                const value = selector.value;
                articles.forEach(function (article) {
                    article.style.display = 'none';
                });
                if (value) {
                    for (var i = 0, len = articles.length; i < len; i++) {
                        const article = articles[i];
                        if (article.querySelector('#' + value)) {
                            selectedArticle = article;
                            break;
                        }
                    }
                }
                else {
                    selectedArticle = articles[0];
                }
                selectedArticle.style.display = 'block';

                render(selectedArticle);
                explain(value);
            });

            var prevHtml = '';
            const render = function (article) {
                const container = article.querySelector('.style-demo-container');
                const curHtml = container.innerHTML;
                if (curHtml) {
                    if (prevHtml !== curHtml) {
                        pre.innerHTML = html_beautify(curHtml, { indent_size: 4 }).replace(/[<>]/g, function (m) { return { '<': '&lt;', '>': '&gt;' }[m] });
                        pre.classList.remove('prettyprinted');
                        prevHtml = curHtml;
                    }
                }
                else {
                    pre.innerHTML = '';
                    prevHtml = '';
                }
            };

            const explanations = document.querySelectorAll('#explanation-section article');
            const explain = function (id) {
                explanations.forEach(function (explanation) {
                    explanation.style.display = explanation.matches('#art-' + id) ? 'block' : 'none';
                });
            };

            TC.loadJS(!window.PR,
                'https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/run_prettify.js',
                function () {
                    setInterval(function () {
                        if (selectedArticle) {
                            render(selectedArticle);
                        }
                        PR.prettyPrint();
                    }, 200);
                }
            );
        });
    }
});
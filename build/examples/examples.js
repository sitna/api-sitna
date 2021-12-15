document.addEventListener('DOMContentLoaded', function () {
    TC.Cfg.notifyApplicationErrors = true;    

    const pre = document.createElement('pre');
    pre.classList.add('prettyprint');
    pre.setAttribute('id', 'view-source');
    const code = document.createElement('code');
    code.classList.add('language-markup');
    pre.appendChild(code);
    document.body.appendChild(pre);

    const a = document.createElement('a');
    a.id = 'close-source';

    const viewSource = function () {
        if (!code.innerHTML) {
            TC.loadCSS('../doc/css/prism.min.css');
            TC.ajax({ url: location.href }).then(function (response) {
                const html = response.data;
                code.innerHTML = html.replace(/[<>]/g, function (m) { return { '<': '&lt;', '>': '&gt;' }[m] });
                document.body.appendChild(hsLink);
                pre.classList.add('fade-in');
                hsLink.classList.add('fade-in');
                TC.loadJS(!window.Prism, '../doc/js/prism.min.js', function () {});
            })
        }
        else {
            pre.classList.remove('fade-out');
            pre.classList.add('fade-in');
            hsLink.classList.remove('fade-out');
            hsLink.classList.add('fade-in');
        }

        var sourceTimer = setInterval(function () {
            if (window.location.hash != '#view-source') {
                clearInterval(sourceTimer);
            }
        }, 200);
    };

    const vsLink = document.createElement('a');
    vsLink.textContent = 'Ver código fuente';
    vsLink.setAttribute('href', '#view-source');
    vsLink.classList.add('view-source-link');
    vsLink.addEventListener('click', function (e) {
        e.stopPropagation();
        viewSource();
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '\u2716';
    closeBtn.classList.add('close-btn');
    closeBtn.addEventListener('click', function (e) {
        var instructions = this;
        while (instructions && !instructions.matches('.instructions')) {
            instructions = instructions.parentElement;
        }
        instructions.classList.add('fade-out');
    });

    const hsLink = document.createElement('a');
    hsLink.textContent = 'Ocultar código fuente';
    hsLink.setAttribute('href', '#')
    hsLink.setAttribute('id', 'hide-source-link')
    hsLink.addEventListener('click', function (e) {
        pre.classList.remove('fade-in');
        pre.classList.add('fade-out');
        hsLink.classList.remove('fade-in');
        hsLink.classList.add('fade-out');
    });

    const fragment = document.createDocumentFragment();
    fragment.appendChild(vsLink);
    fragment.appendChild(closeBtn);
    document.querySelector('.instructions').append(fragment);

    if (location.hash === '#view-source') {
        viewSource();
    }
});
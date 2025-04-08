

document.addEventListener('DOMContentLoaded', function (event) {
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

    const editSource = function () {
        document.location.href = "sandbox.html?" + location.pathname.substring(location.pathname.lastIndexOf("/") + 1);        
    };
    const fragment = document.createDocumentFragment();
    const vsLink = document.createElement('a');
    vsLink.textContent = 'Editar';
    vsLink.setAttribute('href', '');
    vsLink.classList.add('view-source-link');
    vsLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        editSource();
    });
    fragment.appendChild(vsLink);

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

    fragment.appendChild(closeBtn);
    //fragment.appendChild(editLink);
    document.querySelector('.instructions').append(fragment);
    
    /*else if (location.hash === '#edit-source') {
        editSource();
    }*/
});
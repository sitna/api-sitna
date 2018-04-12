/*
    El SW capturará las peticiones de imágenes por img.src y podremos crear mock de respuesta. 
    La validación de las imágenes en HTTP no funcionaría, pero como los test corren en localhost y teniendo en cuenta lo siguiente: 
    durante el desarrollo, podrás usar el service worker a través de localhost. A ver si funciona...
*/

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

self.addEventListener('fetch', function (event) {    
    if (/\.jpg$|.png$/.test(event.request.url)) {
        console.log('Capturamos: ' + event.request.url);
        var createResponse = function () {

            var status = 200;
            if (event.request.url.indexOf('proxy.ashx?') > -1) {
                // esta codificada y no funciona la expresión regular
                status = decodeURIComponent(event.request.url).match(/proxy=(\d{3})/)[1];
            } else {                
                var r = new RegExp(event.request.url.substring(0, event.request.url.indexOf("://")) + "=(\\d{3})");
                status = r.exec(event.request.url)[1];
            }

            var mockedStatus = {
                status: status
            };

            var addHeaders = /nocors=(\d)/.exec(event.request.url);
            if (addHeaders) {
                var headers = new Headers();
                headers.append('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
                headers.append('Access-Control-Allow-Origin', '*');
                mockedStatus.headers = headers;
            }

            console.log('Creamos response nuevo con status: ' + mockedStatus.status);

            var file = null;
            if (mockedStatus.status !== "500") {
                file = dataURLtoFile("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAQAIBRAA7", 'a.png');                
            }

            return new Response(file, mockedStatus);
        };        

        event.respondWith(new Promise(function (resolve, reject) {
            fetch(event.request).then(function (response) {
                console.log('SW fetch response OK');                
                return resolve(createResponse());
            }).catch(function (error) {
                console.log('SW fetch response ERROR');                
                return resolve(createResponse());
            });            
        }));
    }
});
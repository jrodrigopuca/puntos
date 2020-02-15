const cacheName = 'puntos-v1.3.9';

const appShellFiles = [
    'audio/accept.mp3',
    'audio/tema.mp3',
    'img/elementos.png',
    'img/favicon.svg',
    'img/files.png',
    'img/icons-192.png',
    'img/icons-512.png',
    'vendor/phaser.min.js',
    'app.js',
    'index.html',
    'styles.css'
];

self.addEventListener('install', evt => {
    console.log('[ServiceWorker] instalado');
    evt.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(appShellFiles);
        })
    )
})

self.addEventListener('activate', evt =>{
    //limpiar el viejo cache
    evt.waitUntil(
        caches.keys().then((keyList)=>{
            return Promise.all(keyList.map((key)=>{
                if (key!==cacheName){return caches.delete(key)}
            }))
        })
    )
})


self.addEventListener('fetch', function (evt) {
    evt.respondWith(
        caches.match(evt.request).then(function (r) {
            return r || fetch(evt.request).then(function (response) {
                return caches.open(cacheName).then(function (cache) {
                    cache.put(evt.request, response.clone());
                    return response;
                });
            });
        })
    );
});


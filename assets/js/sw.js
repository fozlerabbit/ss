/**
 * Service Worker for ScriptySphere
 * Provides offline functionality and caching strategies
 */

const CACHE_NAME = 'scriptysphere-v1.0.0';
const STATIC_CACHE_NAME = 'scriptysphere-static-v1';
const DYNAMIC_CACHE_NAME = 'scriptysphere-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/assets/css/base.css',
    '/assets/css/components.css',
    '/assets/css/utilities.css',
    '/assets/css/themes.css',
    '/assets/js/main.js',
    '/assets/js/partials.js',
    '/assets/js/i18n.js',
    '/assets/js/theme.js',
    '/assets/img/logo.svg',
    '/assets/img/icons.svg',
    '/assets/i18n/en.json',
    '/assets/i18n/bn.json',
    '/partials/header.html',
    '/partials/nav.html',
    '/partials/footer.html',
    '/partials/cookie.html',
    '/partials/cta.html',
    '/partials/modal.html',
    '/manifest.json'
];

// Runtime caching patterns
const RUNTIME_CACHE_PATTERNS = [
    {
        pattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/,
        strategy: 'CacheFirst',
        maxEntries: 100,
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    {
        pattern: /\.(?:woff|woff2|ttf|eot)$/,
        strategy: 'CacheFirst',
        maxEntries: 30,
        maxAge: 365 * 24 * 60 * 60 // 1 year
    },
    {
        pattern: /\/api\//,
        strategy: 'NetworkFirst',
        maxEntries: 50,
        maxAge: 5 * 60 // 5 minutes
    }
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME && 
                            cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Cache cleanup completed');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and other protocols
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);
    
    // Handle different types of requests
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirstStrategy(event.request));
    } else if (isAPIRequest(url)) {
        event.respondWith(networkFirstStrategy(event.request));
    } else if (isPageRequest(url)) {
        event.respondWith(staleWhileRevalidateStrategy(event.request));
    } else {
        event.respondWith(networkFirstStrategy(event.request));
    }
});

// Caching strategies
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
            
            // Cleanup old entries
            await cleanupCache(DYNAMIC_CACHE_NAME, 100);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (isPageRequest(new URL(request.url))) {
            return caches.match('/offline.html');
        }
        
        return new Response('Offline', { status: 503 });
    }
}

async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const networkPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, but we might have cache
        return cachedResponse;
    });
    
    return cachedResponse || await networkPromise;
}

// Helper functions
function isStaticAsset(url) {
    const pathname = url.pathname;
    return /\.(css|js|png|jpg|jpeg|webp|svg|woff|woff2|ttf|eot|ico)$/.test(pathname) ||
           pathname.startsWith('/assets/') ||
           pathname.startsWith('/partials/');
}

function isAPIRequest(url) {
    return url.pathname.startsWith('/api/') || 
           url.pathname.includes('.json') ||
           url.hostname !== self.location.hostname;
}

function isPageRequest(url) {
    return url.pathname.endsWith('/') || 
           url.pathname.endsWith('.html') ||
           (!url.pathname.includes('.') && url.hostname === self.location.hostname);
}

// Cache cleanup utility
async function cleanupCache(cacheName, maxEntries) {
    try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        if (requests.length > maxEntries) {
            const entriesToDelete = requests.slice(0, requests.length - maxEntries);
            await Promise.all(entriesToDelete.map(request => cache.delete(request)));
            console.log(`Cleaned up ${entriesToDelete.length} entries from ${cacheName}`);
        }
    } catch (error) {
        console.error('Cache cleanup failed:', error);
    }
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form') {
        event.waitUntil(syncContactForms());
    } else if (event.tag === 'newsletter') {
        event.waitUntil(syncNewsletterSubscriptions());
    }
});

async function syncContactForms() {
    try {
        // Retrieve pending form submissions from IndexedDB
        const pendingForms = await getPendingForms('contact');
        
        for (const formData of pendingForms) {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    body: formData.data
                });
                
                if (response.ok) {
                    await removePendingForm('contact', formData.id);
                    console.log('Contact form synced successfully');
                }
            } catch (error) {
                console.error('Failed to sync contact form:', error);
            }
        }
    } catch (error) {
        console.error('Contact form sync failed:', error);
    }
}

async function syncNewsletterSubscriptions() {
    try {
        const pendingSubscriptions = await getPendingForms('newsletter');
        
        for (const subscription of pendingSubscriptions) {
            try {
                const response = await fetch('/api/newsletter', {
                    method: 'POST',
                    body: subscription.data
                });
                
                if (response.ok) {
                    await removePendingForm('newsletter', subscription.id);
                    console.log('Newsletter subscription synced successfully');
                }
            } catch (error) {
                console.error('Failed to sync newsletter subscription:', error);
            }
        }
    } catch (error) {
        console.error('Newsletter sync failed:', error);
    }
}

// IndexedDB helpers for offline form storage
async function getPendingForms(type) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ScriptySphereOffline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pendingForms'], 'readonly');
            const store = transaction.objectStore('pendingForms');
            const index = store.index('type');
            const getRequest = index.getAll(type);
            
            getRequest.onsuccess = () => resolve(getRequest.result || []);
            getRequest.onerror = () => reject(getRequest.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const store = db.createObjectStore('pendingForms', { keyPath: 'id', autoIncrement: true });
            store.createIndex('type', 'type', { unique: false });
        };
    });
}

async function removePendingForm(type, id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ScriptySphereOffline', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pendingForms'], 'readwrite');
            const store = transaction.objectStore('pendingForms');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const options = {
        body: event.data.text(),
        icon: '/assets/img/icon-192x192.png',
        badge: '/assets/img/badge-72x72.png',
        tag: 'scriptysphere-notification',
        renotify: true,
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Details'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('ScriptySphere Update', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync for cache updates
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-sync') {
        event.waitUntil(updateContentCache());
    }
});

async function updateContentCache() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        
        // Update critical content
        const criticalUrls = [
            '/assets/data/search-index.json',
            '/assets/data/members.json',
            '/assets/data/programmes.json',
            '/assets/data/impact.json'
        ];
        
        await Promise.all(
            criticalUrls.map(async (url) => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                } catch (error) {
                    console.warn(`Failed to update ${url}:`, error);
                }
            })
        );
        
        console.log('Content cache updated successfully');
    } catch (error) {
        console.error('Content cache update failed:', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');

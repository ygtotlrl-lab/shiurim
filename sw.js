// sw.js — service worker של האפליקציה
importScripts('./app.config.js');
// מכאן נגזרת גרסת האפליקציה שבבאנר.
var CACHE_NAME = self.APP.id + '-v37';

var CORE = [
  './',
  './index.html',
  './app.config.js',
  './core/boot.js',
  './core/sw.js',
  './core/ui.css',
  './core/chart.css',
  './app/style.css',
  './core/util.js',
  './core/sync.js',
  './core/storage.js',
  './core/mirror.js',
  './core/backup.js',
  './core/boot-run.js',
  './core/ui.js',
  './core/chart.js',
  './core/hebrew.js',
  './app/constants.js',
  './app/icons.js',
  './app/state.js',
  './app/domain.js',
  './app/screens/home.js',
  './app/screens/rambam.js',
  './app/screens/chumash.js',
  './app/screens/shnayim.js',
  './app/screens/hayom.js',
  './app/screens/tanya.js',
  './app/main.js',
  './manifest.json',
  './icons/icon-192.b6655e27.png',
  './icons/icon-512.36eebf61.png',
];

// גרסאות נעוצות במדויק — major צף נשבר בשחרור של הספק בלי שינוי קוד.
var CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.js'
];

importScripts('./core/sw.js');

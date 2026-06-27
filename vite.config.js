import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:     resolve(__dirname, 'index.html'),
        heritage: resolve(__dirname, 'heritage.html'),
        menu:     resolve(__dirname, 'menu.html'),
        gifts:    resolve(__dirname, 'gifts.html'),
        contact:  resolve(__dirname, 'contact.html'),
      },
    },
  },
});

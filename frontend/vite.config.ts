import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin(), tailwindcss()],
  server: {
    host: true,
    port: Number(process.env.VITE_MEALTICKET_FRONTEND_PORT) || 3000,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         // Memaksa Vite membuka akses ke 0.0.0.0 (semua IP)
    port: 5173,         // Mengunci port di 5173
    strictPort: true,   // Jika 5173 dipakai, Vite akan error dan tidak pindah ke 5174
    cors: true,         // Mengizinkan akses silang dari URL devtunnels
    allowedHosts: true  // Mengizinkan akses dari host luar (untuk Vite versi terbaru)
  }
})
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_MPC_HELLO_BASE ?? '/mpc-hello/',
  plugins: [],
});

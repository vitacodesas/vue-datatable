import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
      vue(),
      dts({
        insertTypesEntry: true,  // Esto asegura que se añadan los tipos de entrada
      }),
    ],
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'VueDatatable',
        formats: ['es', 'cjs'],
        fileName: (format) => `vue-datatable.${format}.js`,
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue',
          },
        },
      },
    },
  })

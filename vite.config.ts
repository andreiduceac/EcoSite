import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],test:{environment:'node'},server:{host:'0.0.0.0'},build:{chunkSizeWarningLimit:1100,rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules/maplibre-gl'))return 'maplibre';if(id.includes('node_modules/terra-draw'))return 'drawing';if(id.includes('node_modules/recharts')||id.includes('node_modules/d3-')||id.includes('node_modules/victory-vendor'))return 'charts';if(id.includes('node_modules/@turf'))return 'geometry';}}}}});

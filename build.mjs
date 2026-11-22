import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('docs',{recursive:true});
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,outfile:'docs/game.js',target:['es2020'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
await copyFile('index.html','docs/index.html');
console.log('Built docs/ for GitHub Pages. No API key or server required.');

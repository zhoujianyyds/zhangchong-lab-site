const { copyFileSync, existsSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const indexPath = join(__dirname, '..', 'dist', 'index.html')
const fallbackPath = join(__dirname, '..', 'dist', '404.html')
const netlifyRedirectsPath = join(__dirname, '..', 'dist', '_redirects')

if (existsSync(indexPath)) {
  copyFileSync(indexPath, fallbackPath)
  writeFileSync(netlifyRedirectsPath, '/* /index.html 200\n')
}

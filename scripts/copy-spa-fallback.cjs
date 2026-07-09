const { copyFileSync, existsSync } = require('node:fs')
const { join } = require('node:path')

const indexPath = join(__dirname, '..', 'dist', 'index.html')
const fallbackPath = join(__dirname, '..', 'dist', '404.html')

if (existsSync(indexPath)) {
  copyFileSync(indexPath, fallbackPath)
}

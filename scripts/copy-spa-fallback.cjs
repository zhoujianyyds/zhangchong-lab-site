const { copyFileSync, existsSync, rmSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const indexPath = join(__dirname, '..', 'dist', 'index.html')
const fallbackPath = join(__dirname, '..', 'dist', '404.html')
const netlifyRedirectsPath = join(__dirname, '..', 'dist', '_redirects')
const isCloudflarePages = Boolean(process.env.CF_PAGES)
const isNetlify = Boolean(process.env.NETLIFY)

if (isCloudflarePages) {
  rmSync(fallbackPath, { force: true })
  rmSync(netlifyRedirectsPath, { force: true })
  process.exit(0)
}

if (existsSync(indexPath)) {
  copyFileSync(indexPath, fallbackPath)
  if (isNetlify) {
    writeFileSync(netlifyRedirectsPath, '/* /index.html 200\n')
  } else {
    rmSync(netlifyRedirectsPath, { force: true })
  }
}

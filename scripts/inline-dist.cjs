const { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } = require('node:fs')
const { join } = require('node:path')

const root = join(__dirname, '..')
const dist = join(root, 'dist')
const out = join(root, 'dist-inline')
let html = readFileSync(join(dist, 'index.html'), 'utf8')

html = html.replace(
  /<script type="module" crossorigin src="\/assets\/([^"]+)"><\/script>/,
  (_, file) => `<script type="module">\n${readFileSync(join(dist, 'assets', file), 'utf8')}\n</script>`,
)

html = html.replace(
  /<link rel="stylesheet" crossorigin href="\/assets\/([^"]+)">/,
  (_, file) => `<style>\n${readFileSync(join(dist, 'assets', file), 'utf8')}\n</style>`,
)

html = html.replace(/\/assets\/hero-[^"`']+?\.png/g, (file) => {
  const image = readFileSync(join(dist, file.replace(/^\//, '')))
  return `data:image/png;base64,${image.toString('base64')}`
})

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'index.html'), html)
writeFileSync(join(out, '404.html'), html)
writeFileSync(join(out, '_redirects'), '/* /index.html 200\n')

for (const file of ['favicon.svg', 'icons.svg']) {
  const from = join(dist, file)
  if (existsSync(from)) copyFileSync(from, join(out, file))
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片读取失败'))
    image.src = source
  })
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

export async function compressImageFile(file, maxDimension = 640, quality = 0.8) {
  return compressImageDataUrl(await readImageFile(file), maxDimension, quality)
}

export async function compressImageDataUrl(source, maxDimension = 640, quality = 0.8) {
  if (typeof source !== 'string' || !source.startsWith('data:image/')) return source

  const image = await loadImage(source)
  if (!image.naturalWidth || !image.naturalHeight) return source

  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return source
  context.drawImage(image, 0, 0, width, height)

  let compressed = canvas.toDataURL('image/webp', quality)
  if (!compressed.startsWith('data:image/webp')) compressed = canvas.toDataURL('image/jpeg', quality)
  return compressed.length < source.length ? compressed : source
}

export async function compressMemberPhotos(members) {
  let changed = false
  for (const member of members || []) {
    if (typeof member.photo !== 'string' || member.photo.length < 80_000) continue
    try {
      const compressed = await compressImageDataUrl(member.photo, 640, 0.8)
      if (compressed !== member.photo) {
        member.photo = compressed
        changed = true
      }
    } catch {
      // Keep the original photo if this browser cannot decode or re-encode it.
    }
  }
  return changed
}

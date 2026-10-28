// Reduz a foto antes de enviar: celulares tiram fotos de 3–8 MB.
// - foto: 1600px em JPEG (~300–600 KB) — só baixada quando alguém amplia
// - miniatura: 360px (~20–40 KB) — usada nas grades e nos cartões

async function redimensionar(origem: Blob, ladoMaximo: number, qualidade: number): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(origem, { imageOrientation: 'from-image' })
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height))
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, largura, altura)
    bitmap.close()

    return await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', qualidade))
  } catch {
    // Formato que o navegador não abre (ex.: HEIC no Chrome)
    return null
  }
}

export async function comprimirImagem(arquivo: Blob): Promise<Blob> {
  return (await redimensionar(arquivo, 1600, 0.82)) ?? arquivo
}

/** Miniatura quadradinha das grades. null se o navegador não conseguir gerar. */
export function gerarMiniatura(arquivo: Blob): Promise<Blob | null> {
  return redimensionar(arquivo, 360, 0.7)
}

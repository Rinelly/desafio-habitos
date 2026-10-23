// Reduz a foto antes de enviar: celulares tiram fotos de 3–8 MB,
// e para o desafio 1600px em JPEG já fica ótimo (~300–600 KB).

const LADO_MAXIMO = 1600
const QUALIDADE = 0.82

export async function comprimirImagem(arquivo: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, largura, altura)
    bitmap.close()

    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', QUALIDADE))
    if (blob) return blob
  } catch {
    // Formato que o navegador não abre (ex.: HEIC no Chrome): manda o original
  }
  return arquivo
}

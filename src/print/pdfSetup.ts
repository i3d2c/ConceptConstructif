import * as pdfMakeModule from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'

// pdfmake's browser build is a webpack UMD bundle: Vite's CJS interop exposes
// its actual API under `.default` rather than spreading it onto the namespace.
type PdfMakeApi = typeof pdfMakeModule
const pdfMake = (pdfMakeModule as unknown as { default: PdfMakeApi }).default

pdfMake.addVirtualFileSystem(vfsFonts)

export { pdfMake }

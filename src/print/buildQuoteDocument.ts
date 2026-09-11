import type { Column, Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { Project } from '../domain/models/Project'
import type { Zone } from '../domain/models/Zone'
import type { CompanyProfile } from '../domain/models/CompanyProfile'
import type { PrintConfig } from './PrintConfig'
import { buildPrintData } from './buildPrintData'

export interface QuoteDocumentInput {
  project: Project
  zone: Zone
  config: PrintConfig
  companyProfile: CompanyProfile
  canvas2DImage: string | null
  canvas3DImage: string | null
}

const THEME = { primary: '#1d4ed8', primaryLight: '#eff6ff', text: '#1f2937' }

function compact<T>(items: Array<T | null | false | undefined>): T[] {
  return items.filter((item): item is T => Boolean(item))
}

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtQty(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}

function headerRow(labels: string[]): TableCell[] {
  return labels.map(label => ({ text: label, bold: true, color: 'white', fillColor: THEME.primary }))
}

// The default Roboto font pdfmake embeds has no glyph for ▶/⚠, so warnings use plain ASCII instead.
function errorMarkedName(name: string, hasError: boolean): Content {
  return hasError ? { text: [name, { text: ' (!)', color: '#b45309', bold: true }] } : name
}

function tableLayout(headerRows = 1) {
  return {
    hLineWidth: (i: number) => (i === headerRows ? 1 : 0.5),
    vLineWidth: () => 0,
    hLineColor: () => '#ddd',
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
    fillColor: (rowIndex: number) => (rowIndex >= headerRows && (rowIndex - headerRows) % 2 === 1 ? THEME.primaryLight : null),
  }
}

function sectionTitle(text: string): Content {
  return { text, style: 'sectionTitle' }
}

function buildTitleSection(project: Project, zone: Zone, companyProfile: CompanyProfile): Content {
  return {
    columns: [
      {
        width: '*',
        stack: compact<Content>([
          companyProfile.logo ? { image: companyProfile.logo, fit: [70, 50] } : null,
          companyProfile.companyName ? { text: companyProfile.companyName, bold: true, fontSize: 13 } : null,
          companyProfile.contactName ? { text: companyProfile.contactName, fontSize: 9, color: '#555' } : null,
          companyProfile.phone ? { text: companyProfile.phone, fontSize: 9, color: '#555' } : null,
          companyProfile.email ? { text: companyProfile.email, fontSize: 9, color: '#555' } : null,
        ]),
      },
      {
        width: '*',
        stack: [
          { text: 'DEVIS', bold: true, fontSize: 22, alignment: 'right', color: THEME.primary },
          { text: project.name, fontSize: 13, alignment: 'right', margin: [0, 6, 0, 0] },
          { text: zone.name, fontSize: 10, alignment: 'right', color: '#666' },
          { text: new Date().toLocaleDateString('fr-FR'), fontSize: 9, alignment: 'right', color: '#666' },
        ],
      },
    ],
    margin: [0, 0, 0, 16],
  }
}

function buildLegend(project: Project, zone: Zone): Content | null {
  const rows = zone.traces
    .map(trace => {
      const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
      const ouvrage = project.ouvrages.find(o => o.id === ca?.ouvrageId)
      if (!ca || !ouvrage) return null
      return { number: trace.number, color: ca.color, ouvrageName: ouvrage.name }
    })
    .filter((r): r is { number: number; color: string; ouvrageName: string } => r !== null)
    .sort((a, b) => a.number - b.number)

  if (rows.length === 0) return null

  return {
    table: {
      widths: [10, '*'],
      body: rows.map(r => [
        { text: '', fillColor: r.color },
        { text: `N°${r.number} — ${r.ouvrageName}`, fontSize: 8 },
      ]),
    },
    layout: 'noBorders',
  }
}

function buildPlanSection(project: Project, zone: Zone, canvas2DImage: string): Content {
  const legend = buildLegend(project, zone)
  return {
    stack: [
      sectionTitle('Plan 2D'),
      {
        columns: compact<Column>([
          { image: canvas2DImage, fit: [360, 300] },
          legend ? { width: 150, stack: [legend] } : null,
        ]),
        columnGap: 10,
      },
    ],
    margin: [0, 0, 0, 16],
  }
}

function build3DSection(canvas3DImage: string): Content {
  return {
    stack: [
      sectionTitle('Vue 3D'),
      { image: canvas3DImage, fit: [420, 320], alignment: 'center' },
    ],
    margin: [0, 0, 0, 16],
  }
}

function buildRecapOuvrageSection(data: ReturnType<typeof buildPrintData>): Content {
  const body: TableCell[][] = [headerRow(['Ouvrage', 'Constituant', 'Qté tot.', 'Unité', 'P.U.', 'Total'])]
  for (const o of data.recapOuvrages) {
    body.push([
      { text: o.ouvrageName, bold: true, colSpan: 5 }, {}, {}, {}, {},
      { text: `${fmt(o.total)} €`, alignment: 'right' },
    ])
    for (const c of o.constituents) {
      body.push([
        '',
        errorMarkedName(c.name, c.hasError),
        { text: fmtQty(c.quantity), alignment: 'right' },
        c.unit,
        { text: `${fmt(c.unitPrice)} €`, alignment: 'right' },
        { text: `${fmt(c.total)} €`, alignment: 'right' },
      ])
    }
  }
  body.push([
    { text: 'Total général', colSpan: 5, alignment: 'right', bold: true }, {}, {}, {}, {},
    { text: `${fmt(data.recapOuvrageTotal)} €`, alignment: 'right', bold: true },
  ])

  return {
    stack: [
      sectionTitle('Récapitulatif par ouvrage'),
      { table: { headerRows: 1, widths: ['*', '*', 'auto', 'auto', 'auto', 'auto'], body }, layout: tableLayout() },
    ],
    margin: [0, 0, 0, 16],
  }
}

function buildDevisSection(data: ReturnType<typeof buildPrintData>): Content {
  const body: TableCell[][] = [headerRow(['Ouvrage', 'Prix'])]
  for (const l of data.devisLines) {
    body.push([
      {
        stack: compact<Content>([
          { text: l.ouvrageName, bold: true },
          l.description ? { text: l.description, fontSize: 8, color: '#555' } : null,
        ]),
      },
      { text: `${fmt(l.price)} €`, alignment: 'right' },
    ])
  }
  body.push([{ text: 'Total', alignment: 'right', bold: true }, { text: `${fmt(data.devisTotal)} €`, alignment: 'right', bold: true }])

  return {
    stack: [
      sectionTitle('Devis'),
      { table: { headerRows: 1, widths: ['*', 'auto'], body }, layout: tableLayout() },
    ],
    margin: [0, 0, 0, 16],
  }
}

function buildRecapConstituentSection(data: ReturnType<typeof buildPrintData>): Content {
  const body: TableCell[][] = [headerRow(['Constituant', 'Fournisseur', 'Qté tot.', 'Unité', 'P.U.', 'Total'])]
  for (const c of data.recapConstituents) {
    body.push([
      errorMarkedName(c.name, c.hasError),
      c.supplier ?? '—',
      { text: fmtQty(c.quantity), alignment: 'right' },
      c.unit,
      { text: `${fmt(c.unitPrice)} €`, alignment: 'right' },
      { text: `${fmt(c.total)} €`, alignment: 'right' },
    ])
  }
  body.push([
    { text: 'Total général', colSpan: 5, alignment: 'right', bold: true }, {}, {}, {}, {},
    { text: `${fmt(data.recapConstituentTotal)} €`, alignment: 'right', bold: true },
  ])

  return {
    stack: [
      sectionTitle('Récapitulatif par constituant'),
      { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'], body }, layout: tableLayout() },
    ],
    margin: [0, 0, 0, 16],
  }
}

function buildListSection(data: ReturnType<typeof buildPrintData>): Content {
  const body: TableCell[][] = [headerRow(['N°', 'Constituant', 'Qté', 'Unité', 'P.U.', 'Total'])]
  for (const t of data.traces) {
    body.push([
      { text: `› Tracé n°${t.traceNumber} — ${t.ouvrageName}`, colSpan: 6, italics: true, fillColor: THEME.primaryLight }, {}, {}, {}, {}, {},
    ])
    for (const c of t.constituents) {
      body.push([
        '',
        c.name,
        c.error ? { text: '(!) Erreur', color: '#b91c1c', italics: true } : { text: fmtQty(c.quantity), alignment: 'right' },
        c.unit,
        { text: `${fmt(c.unitPrice)} €`, alignment: 'right' },
        { text: `${fmt(c.total)} €`, alignment: 'right' },
      ])
    }
    body.push([
      { text: 'Sous-total', colSpan: 5, alignment: 'right', italics: true }, {}, {}, {}, {},
      { text: `${fmt(t.subtotal)} €`, alignment: 'right' },
    ])
  }
  body.push([
    { text: 'Total général', colSpan: 5, alignment: 'right', bold: true }, {}, {}, {}, {},
    { text: `${fmt(data.grandTotal)} €`, alignment: 'right', bold: true },
  ])

  return {
    stack: [
      sectionTitle('Liste détaillée par tracé'),
      { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body }, layout: tableLayout() },
    ],
    margin: [0, 0, 0, 16],
  }
}

export function buildQuoteDocument(input: QuoteDocumentInput): TDocumentDefinitions {
  const { project, zone, config, companyProfile, canvas2DImage, canvas3DImage } = input
  const data = buildPrintData(project, zone)

  const content: Content[] = compact<Content>([
    config.title ? buildTitleSection(project, zone, companyProfile) : null,
    config.show2D && canvas2DImage ? buildPlanSection(project, zone, canvas2DImage) : null,
    config.show3D && canvas3DImage ? build3DSection(canvas3DImage) : null,
    config.showRecapOuvrage ? buildRecapOuvrageSection(data) : null,
    config.showDevis ? buildDevisSection(data) : null,
    config.showRecapConstituent ? buildRecapConstituentSection(data) : null,
    config.showList ? buildListSection(data) : null,
  ])

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 40, 40, 50],
    content,
    styles: {
      sectionTitle: { fontSize: 13, bold: true, color: THEME.text, margin: [0, 4, 0, 8] },
    },
    defaultStyle: { fontSize: 10 },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#888',
      margin: [0, 10, 0, 0],
    }),
  }
}

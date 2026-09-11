import { describe, it, expect } from 'vitest'
import { buildQuoteDocument } from '../buildQuoteDocument'
import { defaultPrintConfig } from '../PrintConfig'
import { emptyCompanyProfile } from '../../domain/models/CompanyProfile'
import type { QuoteDocumentInput } from '../buildQuoteDocument'
import type { Project } from '../../domain/models/Project'
import type { Zone, ColorAssignment } from '../../domain/models/Zone'
import type { Ouvrage } from '../../domain/models/Ouvrage'
import type { Constituent } from '../../domain/models/Constituent'
import type { LineTrace } from '../../domain/models/Trace'
import type { Content } from 'pdfmake/interfaces'

const usedConstituent: Constituent = {
  id: 'c-used', name: 'Brique pleine', unit: 'unité', unitPrice: 0.92, category: 'Maçonnerie', formulaRecap: 'ceil(X)',
}
const usedOuvrage: Ouvrage = {
  id: 'o-used', name: 'Mur brique', description: 'Mur en brique pleine porteuse', category: 'Maçonnerie',
  constituents: [{ id: 'oc-used', constituentId: usedConstituent.id, position: 1, formula: 'L/3' }],
}
const colorAssignment: ColorAssignment = {
  id: 'ca-1', color: '#3366ff', ouvrageId: usedOuvrage.id, epaisseur: 0.2, hauteur: 2.5,
}
const drawnTrace: LineTrace = {
  id: 't-1', number: 1, type: 'line', colorAssignmentId: colorAssignment.id, up: 0,
  points: [[0, 0], [100, 0]],
}

function makeZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'zone-1', name: 'Zone 1', backgroundImage: null, backgroundImageLayout: null,
    scale: { pixelLength: 100, realLength: 5, ratio: 0.05, tracePoints: [[0, 0], [100, 0]] },
    colorAssignments: [colorAssignment], traces: [drawnTrace], printConfig: defaultPrintConfig(),
    ...overrides,
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1', name: 'Projet Dupont', ouvrages: [usedOuvrage], constituents: [usedConstituent],
    zones: [makeZone()], activeZoneId: 'zone-1',
    createdAt: '', updatedAt: '',
    ...overrides,
  }
}

function makeInput(overrides: Partial<QuoteDocumentInput> = {}): QuoteDocumentInput {
  const project = makeProject()
  return {
    project,
    zone: project.zones[0],
    config: defaultPrintConfig(),
    companyProfile: emptyCompanyProfile(),
    canvas2DImage: null,
    canvas3DImage: null,
    ...overrides,
  }
}

function contentToArray(content: Content | Content[]): Content[] {
  return Array.isArray(content) ? content : [content]
}

function flattenText(content: Content | Content[]): string {
  return JSON.stringify(content)
}

// Sections are built as `{ stack: [sectionTitle(titleText), tableContent] }` -
// find a section by its title and return its table body.
function findSectionTableBody(content: Content | Content[], titleText: string): unknown[][] {
  for (const item of contentToArray(content)) {
    if (!item || typeof item !== 'object') continue
    const obj = item as unknown as Record<string, unknown>
    if (Array.isArray(obj.stack)) {
      const [first, second] = obj.stack as Record<string, unknown>[]
      if (first?.text === titleText && second?.table) {
        return (second.table as { body: unknown[][] }).body
      }
      const nested = findSectionTableBody(obj.stack as Content[], titleText)
      if (nested.length > 0) return nested
    }
  }
  return []
}

describe('buildQuoteDocument', () => {
  describe('page setup', () => {
    it('Should default to A4 portrait', () => {
      const doc = buildQuoteDocument(makeInput())

      expect(doc.pageSize).toBe('A4')
      expect(doc.pageOrientation).toBe('portrait')
    })
  })

  describe('title section', () => {
    it('Should include the project and zone name when config.title is true', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), title: true } }))

      expect(flattenText(doc.content)).toContain('Projet Dupont')
      expect(flattenText(doc.content)).toContain('Zone 1')
    })

    it('Should not include the project name when config.title is false', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), title: false } }))

      expect(flattenText(doc.content)).not.toContain('Projet Dupont')
    })

    it('Should include the company name when a company profile is set', () => {
      const doc = buildQuoteDocument(makeInput({
        config: { ...defaultPrintConfig(), title: true },
        companyProfile: { ...emptyCompanyProfile(), companyName: 'Concept Constructif' },
      }))

      expect(flattenText(doc.content)).toContain('Concept Constructif')
    })
  })

  describe('plan 2D section', () => {
    it('Should include the 2D image and a color legend when show2D is true and an image is provided', () => {
      const doc = buildQuoteDocument(makeInput({
        config: { ...defaultPrintConfig(), show2D: true },
        canvas2DImage: 'data:image/png;base64,abc',
      }))

      expect(flattenText(doc.content)).toContain('data:image/png;base64,abc')
      expect(flattenText(doc.content)).toContain(usedOuvrage.name)
    })

    it('Should not include the 2D image when show2D is false', () => {
      const doc = buildQuoteDocument(makeInput({
        config: { ...defaultPrintConfig(), show2D: false },
        canvas2DImage: 'data:image/png;base64,abc',
      }))

      expect(flattenText(doc.content)).not.toContain('data:image/png;base64,abc')
    })
  })

  describe('vue 3D section', () => {
    it('Should include the 3D image when show3D is true and an image is provided', () => {
      const doc = buildQuoteDocument(makeInput({
        config: { ...defaultPrintConfig(), show3D: true },
        canvas3DImage: 'data:image/png;base64,xyz',
      }))

      expect(flattenText(doc.content)).toContain('data:image/png;base64,xyz')
    })

    it('Should not include the 3D image when show3D is false', () => {
      const doc = buildQuoteDocument(makeInput({
        config: { ...defaultPrintConfig(), show3D: false },
        canvas3DImage: 'data:image/png;base64,xyz',
      }))

      expect(flattenText(doc.content)).not.toContain('data:image/png;base64,xyz')
    })
  })

  describe('recap ouvrage table', () => {
    it('Should render a header row, one row per ouvrage, one row per constituent line, and a total row when showRecapOuvrage is true', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), showRecapOuvrage: true } }))

      const body = findSectionTableBody(doc.content, 'Récapitulatif par ouvrage')
      // header + 1 ouvrage row + 1 constituent row + total row
      expect(body).toHaveLength(4)
    })

    it('Should not render the table when showRecapOuvrage is false', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), showRecapOuvrage: false, showDevis: false, showRecapConstituent: false, showList: false } }))

      expect(flattenText(doc.content)).not.toContain('Récapitulatif par ouvrage')
    })
  })

  describe('devis table', () => {
    it('Should render a header row, one row per used ouvrage, and a total row when showDevis is true', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), showDevis: true } }))

      const body = findSectionTableBody(doc.content, 'Devis')
      expect(body).toHaveLength(3)
      expect(JSON.stringify(body)).toContain(usedOuvrage.description)
    })
  })

  describe('recap constituent table', () => {
    it('Should render a header row, one row per constituent, and a total row when showRecapConstituent is true', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), showRecapConstituent: true } }))

      const body = findSectionTableBody(doc.content, 'Récapitulatif par constituant')
      expect(body).toHaveLength(3)
      expect(JSON.stringify(body)).toContain(usedConstituent.name)
    })
  })

  describe('liste détaillée table', () => {
    it('Should render a row for the trace header when showList is true', () => {
      const doc = buildQuoteDocument(makeInput({ config: { ...defaultPrintConfig(), showList: true } }))

      expect(flattenText(doc.content)).toContain('Tracé n°1')
    })
  })

  describe('footer', () => {
    it('Should render the current page and page count', () => {
      const doc = buildQuoteDocument(makeInput())

      const footer = doc.footer as (currentPage: number, pageCount: number) => Content
      expect(flattenText(footer(2, 5))).toContain('2')
      expect(flattenText(footer(2, 5))).toContain('5')
    })
  })
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ouvrage } from '../domain/models/Ouvrage'
import type { Constituent } from '../domain/models/Constituent'
import { findUnpublishedConstituents } from '../domain/services/LibraryImportService'
import {
  listLibraryOuvrages, listLibraryConstituents,
  saveLibraryOuvrage, saveLibraryConstituent,
  deleteLibraryOuvrage, deleteLibraryConstituent,
} from '../storage/LibraryStore'

export type PublishResult =
  | { published: true }
  | { published: false; missing: Constituent[] }

export const useLibraryStore = defineStore('library', () => {
  const ouvrages = ref<Ouvrage[]>([])
  const constituents = ref<Constituent[]>([])

  async function loadLibrary() {
    ouvrages.value = await listLibraryOuvrages()
    constituents.value = await listLibraryConstituents()
  }

  async function upsertOuvrage(ouvrage: Ouvrage) {
    await saveLibraryOuvrage(ouvrage)
    const idx = ouvrages.value.findIndex(o => o.id === ouvrage.id)
    if (idx === -1) ouvrages.value.push(ouvrage)
    else ouvrages.value[idx] = ouvrage
  }

  async function upsertConstituent(constituent: Constituent) {
    await saveLibraryConstituent(constituent)
    const idx = constituents.value.findIndex(c => c.id === constituent.id)
    if (idx === -1) constituents.value.push(constituent)
    else constituents.value[idx] = constituent
  }

  async function removeOuvrage(id: string) {
    await deleteLibraryOuvrage(id)
    ouvrages.value = ouvrages.value.filter(o => o.id !== id)
  }

  async function removeConstituent(id: string) {
    await deleteLibraryConstituent(id)
    constituents.value = constituents.value.filter(c => c.id !== id)
  }

  const ouvrageIds = computed(() => new Set(ouvrages.value.map(o => o.id)))
  const constituentIds = computed(() => new Set(constituents.value.map(c => c.id)))
  const constituentsById = computed(() => new Map(constituents.value.map(c => [c.id, c])))

  async function publishOuvrage(ouvrage: Ouvrage, localConstituents: Constituent[]): Promise<PublishResult> {
    const missing = findUnpublishedConstituents(ouvrage, localConstituents, constituentIds.value)
    if (missing.length > 0) return { published: false, missing }
    await upsertOuvrage(ouvrage)
    return { published: true }
  }

  async function publishConstituent(constituent: Constituent): Promise<PublishResult> {
    await upsertConstituent(constituent)
    return { published: true }
  }

  return {
    ouvrages,
    constituents,
    loadLibrary,
    upsertOuvrage,
    upsertConstituent,
    removeOuvrage,
    removeConstituent,
    ouvrageIds,
    constituentIds,
    constituentsById,
    publishOuvrage,
    publishConstituent,
  }
})

import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import CompanySettingsDialog from '../CompanySettingsDialog.vue'
import { useSettingsStore } from '../../../stores/settingsStore'

function fileInput(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('input[type="file"]')
}

// FileReader and idb resolve over several macrotasks: a single flushPromises() isn't enough.
async function settle() {
  for (let i = 0; i < 5; i++) await flushPromises()
}

async function triggerFileChange(wrapper: ReturnType<typeof mount>, file: File) {
  const input = fileInput(wrapper).element as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await fileInput(wrapper).trigger('change')
  await settle()
}

describe('CompanySettingsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial fields', () => {
    it('Should pre-fill the company name input from the current company profile', () => {
      const store = useSettingsStore()
      store.companyProfile.companyName = 'Concept Constructif'

      const wrapper = mount(CompanySettingsDialog)

      expect((wrapper.find('[data-testid="company-name"]').element as HTMLInputElement).value)
        .toBe('Concept Constructif')
    })
  })

  describe('Annuler button', () => {
    it('Should close the dialog without persisting edits made to the fields', async () => {
      const store = useSettingsStore()
      const wrapper = mount(CompanySettingsDialog)

      await wrapper.find('[data-testid="company-name"]').setValue('Nouveau nom')
      await wrapper.find('[data-testid="cancel"]').trigger('click')

      expect(store.companyProfile.companyName).toBe('')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('Enregistrer button', () => {
    it('Should persist the edited fields to the settings store and close the dialog', async () => {
      const store = useSettingsStore()
      const wrapper = mount(CompanySettingsDialog)

      await wrapper.find('[data-testid="company-name"]').setValue('Concept Constructif')
      await wrapper.find('[data-testid="contact-name"]').setValue('Guillaume Dubus')
      await wrapper.find('[data-testid="save"]').trigger('click')
      await settle()

      expect(store.companyProfile.companyName).toBe('Concept Constructif')
      expect(store.companyProfile.contactName).toBe('Guillaume Dubus')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('logo upload', () => {
    it('Should store the logo aspect ratio once the image dimensions are known', async () => {
      class FakeImage {
        naturalWidth = 300
        naturalHeight = 150
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          queueMicrotask(() => this.onload?.())
        }
      }
      const OriginalImage = global.Image
      // @ts-expect-error test double replacing the global Image constructor
      global.Image = FakeImage

      const store = useSettingsStore()
      const wrapper = mount(CompanySettingsDialog)
      const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
      await triggerFileChange(wrapper, file)
      await wrapper.find('[data-testid="save"]').trigger('click')
      await settle()

      global.Image = OriginalImage
      expect(store.companyProfile.logoAspectRatio).toBe(2)
    })

    it('Should clear the logo aspect ratio when the logo is removed', async () => {
      class FakeImage {
        naturalWidth = 300
        naturalHeight = 150
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          queueMicrotask(() => this.onload?.())
        }
      }
      const OriginalImage = global.Image
      // @ts-expect-error test double replacing the global Image constructor
      global.Image = FakeImage

      const wrapper = mount(CompanySettingsDialog)
      const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
      await triggerFileChange(wrapper, file)

      await wrapper.find('[data-testid="remove-logo"]').trigger('click')
      await wrapper.find('[data-testid="save"]').trigger('click')
      await settle()

      global.Image = OriginalImage
      const store = useSettingsStore()
      expect(store.companyProfile.logoAspectRatio).toBeNull()
    })

    it('Should show a preview of the uploaded logo as a data URL', async () => {
      const wrapper = mount(CompanySettingsDialog)
      const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })

      await triggerFileChange(wrapper, file)

      const preview = wrapper.find('[data-testid="logo-preview"]')
      expect(preview.exists()).toBe(true)
      expect((preview.element as HTMLImageElement).src).toMatch(/^data:image\/png;base64,/)
    })

    it('Should remove the logo when the remove button is clicked', async () => {
      const wrapper = mount(CompanySettingsDialog)
      const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' })
      await triggerFileChange(wrapper, file)

      await wrapper.find('[data-testid="remove-logo"]').trigger('click')

      expect(wrapper.find('[data-testid="logo-preview"]').exists()).toBe(false)
    })
  })
})

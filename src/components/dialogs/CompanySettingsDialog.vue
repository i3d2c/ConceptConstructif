<script setup lang="ts">
import { reactive } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { fileToDataURL } from '../../utils/fileToDataURL'
import { getImageDimensions } from '../../utils/getImageDimensions'

const emit = defineEmits<{ close: [] }>()
const store = useSettingsStore()
const profile = reactive({ ...store.companyProfile })

async function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const dataUrl = await fileToDataURL(file)
  profile.logo = dataUrl
  try {
    const { width, height } = await getImageDimensions(dataUrl)
    profile.logoAspectRatio = width / height
  } catch {
    profile.logoAspectRatio = null
  }
}

function removeLogo() {
  profile.logo = null
  profile.logoAspectRatio = null
}

async function handleSave() {
  Object.assign(store.companyProfile, profile)
  await store.save()
  emit('close')
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <h3>Mon entreprise</h3>
      <p class="hint">Ces informations apparaissent sur les devis générés</p>

      <div class="fields">
        <label class="field">
          Nom de l'entreprise
          <input data-testid="company-name" v-model="profile.companyName" type="text" />
        </label>
        <label class="field">
          Nom du contact
          <input data-testid="contact-name" v-model="profile.contactName" type="text" />
        </label>
        <label class="field">
          Téléphone
          <input data-testid="phone" v-model="profile.phone" type="text" />
        </label>
        <label class="field">
          Email
          <input data-testid="email" v-model="profile.email" type="email" />
        </label>

        <div class="field">
          Logo
          <div class="logo-row">
            <img v-if="profile.logo" data-testid="logo-preview" :src="profile.logo" class="logo-preview" />
            <input type="file" accept="image/*" @change="onLogoChange" />
            <button v-if="profile.logo" type="button" data-testid="remove-logo" @click="removeLogo">Supprimer</button>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button data-testid="cancel" @click="emit('close')">Annuler</button>
        <button class="active" data-testid="save" @click="handleSave">Enregistrer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  width: 360px;
  display: flex; flex-direction: column; gap: 12px;
}
h3 { font-size: 14px; }
.hint { color: var(--text-muted); font-size: 11px; }
.fields { display: flex; flex-direction: column; gap: 10px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--text); }
.logo-row { display: flex; align-items: center; gap: 8px; }
.logo-preview { width: 40px; height: 40px; object-fit: contain; border: 1px solid var(--border); border-radius: 4px; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>

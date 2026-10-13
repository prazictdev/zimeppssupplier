<template>
  <div class="overflow-hidden rounded-lg border border-base-300 bg-base-100 focus-within:border-success focus-within:outline-2 focus-within:outline-success/20">
    <div class="flex flex-wrap gap-1 border-b border-base-200 bg-base-200/50 p-2">
      <button v-for="action in actions" :key="action.command" type="button" class="btn btn-ghost btn-xs" :title="action.label" :aria-label="action.label" @mousedown.prevent="runCommand(action.command, action.value)">
        <Icon :name="action.icon" class="h-4 w-4" />
      </button>
    </div>
    <div ref="editor" class="rich-editor min-h-36 px-4 py-3 text-sm outline-none" contenteditable="true" role="textbox" aria-multiline="true" :data-placeholder="placeholder" @input="emitValue" @blur="emitValue" />
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: String, default: '' }, placeholder: { type: String, default: 'Enter your response…' } })
const emit = defineEmits(['update:modelValue'])
const editor = ref(null)
const allowedTags = new Set(['B', 'BR', 'DIV', 'EM', 'I', 'LI', 'OL', 'P', 'STRONG', 'U', 'UL'])
const blockedTags = new Set(['EMBED', 'IFRAME', 'OBJECT', 'SCRIPT', 'STYLE'])
const actions = [
  { command: 'bold', label: 'Bold', icon: 'lucide:bold' },
  { command: 'italic', label: 'Italic', icon: 'lucide:italic' },
  { command: 'underline', label: 'Underline', icon: 'lucide:underline' },
  { command: 'insertUnorderedList', label: 'Bullet list', icon: 'lucide:list' },
  { command: 'insertOrderedList', label: 'Numbered list', icon: 'lucide:list-ordered' },
  { command: 'removeFormat', label: 'Clear formatting', icon: 'lucide:remove-formatting' },
]

onMounted(() => syncContent(props.modelValue))
watch(() => props.modelValue, value => { if (editor.value && editor.value.innerHTML !== value) syncContent(value) })

function sanitizeHtml(value) {
  if (!import.meta.client) return String(value || '')

  const template = document.createElement('template')
  template.innerHTML = String(value || '')
  template.content.querySelectorAll('*').forEach((element) => {
    if (blockedTags.has(element.tagName)) {
      element.remove()
      return
    }
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes)
      return
    }
    for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name)
  })
  return template.innerHTML
}

function syncContent(value) { if (editor.value) editor.value.innerHTML = sanitizeHtml(value) }
function emitValue() {
  const value = sanitizeHtml(editor.value?.innerHTML ?? '')
  if (editor.value && editor.value.innerHTML !== value) editor.value.innerHTML = value
  emit('update:modelValue', value)
}
function runCommand(command, value = null) { editor.value?.focus(); document.execCommand(command, false, value); emitValue() }
</script>

<style scoped>
.rich-editor:empty::before { color: color-mix(in oklab, currentColor 45%, transparent); content: attr(data-placeholder); pointer-events: none; }
.rich-editor :deep(p) { margin-bottom: 0.5rem; }
.rich-editor :deep(ul) { list-style: disc; margin: 0.5rem 0; padding-left: 1.5rem; }
.rich-editor :deep(ol) { list-style: decimal; margin: 0.5rem 0; padding-left: 1.5rem; }
</style>

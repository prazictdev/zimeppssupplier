<template>
  <div>
    <RichTextEditor
      v-if="type === 'TEXT'"
      :model-value="modelValue?.text ?? ''"
      placeholder="Enter your response"
      @update:model-value="update({ text: $event })"
    />
    <div v-else-if="type === 'UPLOAD' && mediaOnly" class="space-y-2">
      <div v-if="modelValue?.file?.media_uuid" class="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
        <Icon name="lucide:file-check-2" class="h-4 w-4 shrink-0" />
        <span class="min-w-0 flex-1 truncate font-medium">{{ modelValue.file.title || modelValue.file.name }}</span>
        <button type="button" class="btn btn-ghost btn-xs text-error" @click="update({ file: null })">Remove</button>
      </div>
      <button type="button" class="btn btn-outline btn-secondary btn-sm" @click="$emit('choose-media')">
        <Icon name="lucide:library" class="h-4 w-4" />
        {{ modelValue?.file?.media_uuid ? 'Replace from Media Center' : 'Choose from Media Center' }}
      </button>
    </div>
    <input
      v-else-if="type === 'UPLOAD'"
      type="file"
      class="file-input file-input-bordered w-full"
      @change="$emit('file', $event)"
    >
    <div v-else class="flex gap-4">
      <label class="label cursor-pointer gap-2"><input type="radio" class="radio radio-primary radio-sm" :checked="modelValue?.answer === 'YES'" @change="update({ answer: 'YES' })"> Yes</label>
      <label class="label cursor-pointer gap-2"><input type="radio" class="radio radio-primary radio-sm" :checked="modelValue?.answer === 'NO'" @change="update({ answer: 'NO' })"> No</label>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  type: { type: String, default: 'YES_NO' },
  mediaOnly: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'file', 'choose-media']);
const update = (value) => emit('update:modelValue', { ...(props.modelValue ?? {}), ...value });
</script>

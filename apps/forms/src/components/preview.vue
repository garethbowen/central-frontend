<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { getFormByFormId, getFormXml, RequestError, type Form } from '../utils/api.ts';
import { hideSpinner } from '../utils/spinner.ts';

const props = defineProps({
  draft: Boolean,
});

const WebFormRenderer = defineAsyncComponent(() => import('./web-form-renderer.vue'));
const EnketoIframe = defineAsyncComponent(() => import('./enketo-iframe.vue'));

const route = useRoute();

const projectId = computed(() => Number.parseInt(encodeURIComponent(route.params.projectId as string)));
const formId = computed(() => encodeURIComponent(route.params.xmlFormId as string));

const useWebForms = route.query.webforms === 'true';
const loadingState = ref(true);
const errorState = ref(false);
const webFormsEnabled = ref(true);
const form = ref<Form>();
const xform = ref<string>();

const fetchForm = async () => {
  loadingState.value = true;
  errorState.value = false;
  try {
    const formConfig = await getFormByFormId(projectId.value, formId.value, props.draft);
    if (formConfig.webformsEnabled || useWebForms) {
      xform.value = await getFormXml(projectId.value, formId.value, props.draft);
      webFormsEnabled.value = true;
    } else {
      webFormsEnabled.value = false;
    }
    form.value = formConfig;
    loadingState.value = false;
  } catch (e) {
    if (e instanceof RequestError && e.statusCode >= 401 && e.statusCode < 404) {
      // not logged in
      const relativeUrl = window.location.href.substring(window.location.origin.length);
      window.location.href = '/login?next=/wf' + relativeUrl;
    } else {
      // unknown error
      errorState.value = true;
    }
    hideSpinner();
    loadingState.value = false;
  }
};

fetchForm();
</script>

<template>
  <template v-if="!loadingState">
    <!--{{ $t('preview.error.not_found') }}-->
    <div v-if="errorState" class="form-load-error">
      {{ $t('preview.error.not_found') }}
    </div>
    <template v-else-if="webFormsEnabled">
      <WebFormRenderer :form="form!" :xform="xform!" action-type="preview"/>
    </template>
    <template v-else>
      <EnketoIframe :form="form!" :enketo-id="form!.enketoId" action-type="preview"/>
    </template>
  </template>
</template>

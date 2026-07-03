<script setup lang="ts">
// import { TRANSLATE, type Translate } from '../utils/translate.ts';
import { computed, inject, ref, h } from 'vue';
import { captureException } from '@sentry/vue';
import { OdkWebForm, POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms';
import { type MonolithicInstancePayload } from '@getodk/xforms-engine';
import { queryString, type Form } from '../utils/api';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Location from '../utils/location';
import { getDeviceId } from '../utils/device-id';
import { hideSpinner } from '../utils/spinner';
defineOptions({
  name: 'WebFormRenderer'
});
import { Translation } from 'vue-i18n';
import { useI18n } from 'vue-i18n';
const { t } = useI18n() ;

export interface WebFormsRendererProps {
  form: Form;
  xform: string;
  actionType: string;
  instanceId?: string | null;
  submissionAttachments?: string[] | null;
  st?: string | null
}

const props = defineProps<WebFormsRendererProps>();

interface SubmissionData {
  instanceFile: File;
  attachments: File[];
}

interface PostPrimaryInstanceParams {
  st: string | undefined;
  deviceID?: string | undefined;
}

let clearForm:Function;
let submissionData: SubmissionData;

// const t: Translate = inject(TRANSLATE)!;
const submissionResult:any = {};
const isEdit = computed(() => props.actionType === 'edit');
const isPublicLink = computed(() => props.actionType === 'public-link');

const deviceID = getDeviceId();

const visibleModal = ref();

const withToken = (url) => `${url}${queryString({ st: props.st })}`;

const getAttachment = (requestUrl: URL) => {
  const encodedName = encodeURIComponent(requestUrl.pathname.split('/').pop()!);
  const draftPath = props.form.draft ? '/draft' : '';
  const url = withToken(`/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}${draftPath}/attachments/${encodedName}`);
  return fetch(url);
};

const postPrimaryInstance = async (file:File) => {
  let url: string;
  let method: string;
  let params: PostPrimaryInstanceParams = {
    st: props.st ?? undefined
  }
  if (isEdit.value) {
    url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}`;
    method = 'PUT';
  } else {
    const draftPath = props.form.draft ? '/draft' : '';
    params.deviceID = deviceID;
    url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}${draftPath}/submissions`;
    method = 'POST';
  }
  url += queryString(params);
  const headers = {
    'Content-Type': 'text/xml',
    'odk-client': `odk-web-forms/${__WEB_FORMS_VERSION__}`,
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest'
  };
  try {
    const response = await fetch(url, { body: file, headers, method });
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    const data = await response.json();
    return { success: false, data: { response: { data } } };
  } catch (error) {
    captureException(error);
    return { success: false, data: error };
  }
};

const isProblem = (data:any) => {
  return data != null &&
    typeof data === 'object' &&
    typeof data.code === 'number' &&
    typeof data.message === 'string';
};

const submissionPath = () => {
  const originalUrl = new URL(window.location.href);
  const newPath = `/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}`;
  return new URL(newPath, originalUrl);
};

const isSessionTimeout = (error) => {
  return error?.response &&
    isProblem(error.response.data) &&
    error.response.data.code === 401.2;
}

const getErrorMessage = (data) => {
  if (!data) {
    return;
  }
  if (!data.code) {
    // undefined error
    return 'util.request.noResponse';
  }
  if (data.code === 413) {
    return 'mixin.request.alert.entityTooLarge';
  }
  if (data.code === 404.1) {
    return 'util.request.problem.404_1';
  }
  return data.message;
};

const handleResult = () => {
  const attachmentResultArr = [...submissionResult.attachmentResult.values()];

  // Success handler
  if (submissionResult.primaryInstanceResult.success && attachmentResultArr.every(r => r.success)) {

    clearForm();
    
    if (isPublicLink.value) {
      visibleModal.value = { type: 'thank_you_modal', hideable: false };
    } else if (isEdit.value) {
      visibleModal.value = { type: 'edit_submission_modal', hideable: false };
      setTimeout(() => {
        Location.assign(submissionPath());
      }, 2000);
    } else {
      visibleModal.value = { type: 'submission_modal', hideable: false };
    }
    return;
  }

  // Error handler - Primary Instance
  if (!submissionResult.primaryInstanceResult.success) {
    const error = submissionResult.primaryInstanceResult.data;
    if (isSessionTimeout(error)) {
      visibleModal.value = { type: 'session_timeout_modal', hideable: true };
    } else {
      const errorMessage = getErrorMessage(error);
      visibleModal.value = { type: 'error_modal', errorMessage, hideable: true };
    }
    return;
  }

  // Error handler - Attachments
  if (attachmentResultArr.some(r => !r.success)) {
    const sessionTimeout = attachmentResultArr.some(r => isSessionTimeout(r.data));
    if (sessionTimeout) {
      visibleModal.value = { type: 'session_timeout_modal', hideable: false };
    } else {
      visibleModal.value = { type: 'retry_modal', hideable: false };
    }
  }
};

const uploadAttachment = async (attachment: File, instanceId: string) => {
  const encodedInstanceId = encodeURIComponent(instanceId);
  const encodedName = encodeURIComponent(attachment.name);

  const url = withToken(`/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${encodedInstanceId}/attachments/${encodedName}`);

  let result;
  try {
    const headers = {
      'Content-Type': attachment.type,
      'X-Requested-With': 'XMLHttpRequest'
    };
    const response = await fetch(url, { body: attachment, headers, method: 'POST' });
    const data = await response.json();
    result = { success: response.ok, data: { response: { data } } };
  } catch (error) {
    captureException(error);
    result = { success: false, data: { response: error } };
  }

  return { name: attachment.name, result };
};

const submitData = async () => {
  visibleModal.value = { type: 'sendingDataModal', hideable: false };

  const instanceFile = submissionData.instanceFile;
  const attachments = submissionData.attachments;

  if (!submissionResult.primaryInstanceResult.success) {
    submissionResult.primaryInstanceResult = await postPrimaryInstance(instanceFile);
  }

  if (submissionResult.primaryInstanceResult.success) {
    const instanceId = submissionResult.primaryInstanceResult.data.instanceId;
    const attachmentRequests = attachments
      .filter(a => !submissionResult.attachmentResult.get(a.name).success)
      .map(a => uploadAttachment(a, instanceId));
    const attachmentResult = await Promise.all(attachmentRequests);
    attachmentResult.forEach(r => {
      submissionResult.attachmentResult.set(r.name, r.result);
    });
  }
  handleResult();
};

const initializeSubmissionState = (data:SubmissionData, clearFormCallback:Function) => {
  submissionData = data;

  submissionResult.primaryInstanceResult = {
    success: false
  };

  submissionResult.attachmentResult = new Map();
  data.attachments.forEach((attachment:File) => {
    submissionResult.attachmentResult.set(attachment.name, {
      success: false
    });
  });

  clearForm = () => {
    clearFormCallback({ next: POST_SUBMIT__NEW_INSTANCE });
  };
};

const webFormLoaded = () => {
  hideSpinner();
};

const handleSubmit = async (
  payload: MonolithicInstancePayload,
  clearFormCallback: Function
) => {
  if (props.actionType === 'preview') {
    visibleModal.value = { type: 'previewModal', hideable: true };
    return;
  }
  const { data: [data], status } = payload;
  if (status !== 'ready') {
    // Status is not ready when Form is not valid and in that case submit button will be disabled,
    // hence this branch should never execute.
    return;
  }
  initializeSubmissionState(data as unknown as SubmissionData, clearFormCallback);
  await submitData();
};

const fetchSubmissionXml = async () => {
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}.xml`;
  const response = await fetch(url);
  return await response.text();
};

const fetchSubmissionAttachment = async (attachmentName: string) => {
  // Draft is always false because we don't support editing of draft submissions
  const encodedName = encodeURIComponent(attachmentName);
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}/attachments/${encodedName}`;
  return fetch(url);
};

const editInstanceOptions = computed(() => {
  if (isEdit.value) {
    return {
      resolveInstance: fetchSubmissionXml,
      attachmentFileNames: props.submissionAttachments,
      resolveAttachment: fetchSubmissionAttachment
    };
  }
  return null;
});

const closeWindow = () => {
  window.close();
};


// const message = new IntlMessageFormat(
//   `Our price is <boldThis>{price, number, ::currency/USD precision-integer}</boldThis> with <link>{pct, number, ::percent} discount</link>`,
//   'en'
// )

// const output = message.format({
//   price: 2,
//   pct: 0.2,
//   // Handler functions for rich text tags
//   boldThis: chunks => `<b>${chunks.join('')}</b>`,
//   link: chunks => `<a>${chunks.join('')}</a>`,
//   // link: chunks => `<a href="https://example.com">${chunks.join('')}</a>`,
// })



// const richMessage = h('p', {}, t('error_modal.body', {
//           errorMessage: (chunks) => h('pre', chunks.join('')),
//           supportEmail: 'hello'
//         }));
// const RenderChunks = () => richMessage;
// const res = t('error_modal.body', {
//   errorMessage: (chunks) => h('pre', chunks),
//   supportEmail: 'hello'
// });
// console.log(h('div', res));
</script>

<style scoped>
.p-dialog-content pre {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>

<template>
  <!-- {{ t('info') }}
   <Translation keypath="info" tag="p">
  
    <template v-slot:limit>
      <span>5</span>
    </template>
    <template v-slot:action>
      <a href="#">{{ $t('change') }}</a>
    </template>
  </Translation> -->
   
<!--
  <Translation keypath="error_modal.body" tag="p">
    <template v-slot:errorMessage>
      <span>ERROR</span>
    </template>
    <template v-slot:supportEmail>
      email
    </template>
  </Translation>
-->
<!--
  <i18n-t keypath="error_modal.body" tag="p" for="tos">
    <a href="#" target="_blank">{{ $t('tos') }}</a>
  </i18n-t>
-->
  <Translation tag="p" keypath="error_modal.body">
    <template #errorMessage>
      <pre>SOME ERROR</pre>
    </template>
    <template #supportEmail>
      <a href="mailto:support@getodk.org">support@getodk.org</a>
    </template>
  </Translation>
      <!--
  <OdkWebForm
    :form-xml="props.xform"
    :edit-instance="editInstanceOptions"
    :fetch-form-attachment="getAttachment"
    :device-id="deviceID"
    @loaded="webFormLoaded"
    @submit="handleSubmit"/>
-->
<!--

  <Dialog modal :visible="!!visibleModal" :draggable="false" :closable="visibleModal?.hideable" @update:visible="visibleModal = null">
		<template #header>
			<span role="heading">{{ t(visibleModal.type + '.title') }}</span>
		</template>

    <template #default>
      <Translation v-if="visibleModal.type === 'errorModal'" tag="p" keypath="errorModal.body">
        <template #errorMessage>
          <pre>{{ t(visibleModal.errorMessage) }}</pre>
        </template>
        <template #supportEmail>
          <a href="mailto:support@getodk.org">support@getodk.org</a>
        </template>
      </Translation>

      <Translation v-else-if="visibleModal.type === 'retryModal'" tag="p" keypath="retryModal.body">
        <template #supportEmail>
          <a href="mailto:support@getodk.org">support@getodk.org</a>
        </template>
      </Translation>
      <Translation v-else-if="visibleModal.type === 'sessionTimeoutModal'" tag="p" keypath="sessionTimeoutModal.body.full">
        <template #here>
          <a href="/login" target="_blank">{{ t('sessionTimeoutModal.body.here') }}</a>
        </template>
      </Translation>
      <span v-else>
        {{ t(visibleModal.type + '.body') }}
      </span>
    </template>
    <template #footer>
      <template v-if="visibleModal.type === 'submissionModal'">
        <Button type="button" @click="closeWindow()" variant="text">{{ t('action.close') }}</Button>
        <Button type="button" @click="visibleModal = null">{{ t('submissionModal.action.fillOutAgain') }}</Button>
      </template>
      -- Any type of error while sending attachments --
      <template v-else-if="visibleModal.type === 'retryModal'
        || (visibleModal.type === 'sessionTimeoutModal' && !visibleModal.hideable)">
        <Button type="button" @click="submitData()">{{ t('action.tryAgain') }}</Button>
      </template>
      !-- Preview modal or any type of error while submitting primary instance --
      <template v-else-if="visibleModal.type === 'previewModal'
        || visibleModal.type === 'errorModal'
        || visibleModal.type === 'sessionTimeoutModal' && visibleModal.hideable">
        <Button type="button" @click="visibleModal = null">{{ t('action.close') }}</Button>
      </template>
    </template>
  </Dialog>
-->
</template>

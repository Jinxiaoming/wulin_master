/**
 * WulinForm handles the submission and validation of legacy WulinMaster forms.
 * It provides mechanisms for disabling/enabling forms during submission
 * and displaying validation errors.
 */

let currentForm = null;
let successCallback = (data) => true;
let failureCallback = (data) => true;

/**
 * Extracts the object name from the form ID (e.g., "new_user" -> "user").
 */
const getObjectName = () => {
  if (!currentForm) return "";
  const formId = currentForm.id;
  const newRegExp = /^new_(.*)$/;
  const editRegExp = /^edit_(.*)$/;
  
  if (newRegExp.test(formId)) {
    return newRegExp.exec(formId)[1];
  } else if (editRegExp.test(formId)) {
    return editRegExp.exec(formId)[1];
  }
  return "";
};

/**
 * Returns the submit button element.
 */
const getSubmitButton = () => {
  return currentForm?.querySelector('#submit input[type="submit"]');
};

/**
 * Disables all inputs in the form and shows a loading state.
 */
const disableForm = () => {
  if (!currentForm) return;
  currentForm.querySelectorAll('input, select, textarea').forEach(el => {
    el.disabled = true;
    el.style.opacity = '0.5';
  });
  
  const btn = getSubmitButton();
  if (btn) {
    btn.dataset.originalValue = btn.value;
    btn.value = 'Please wait...';
  }
};

/**
 * Re-enables form inputs and restores the submit button.
 */
const enableForm = () => {
  if (!currentForm) return;
  currentForm.querySelectorAll('input, select, textarea').forEach(el => {
    el.disabled = false;
    el.style.opacity = '1.0';
  });
  
  const btn = getSubmitButton();
  if (btn && btn.dataset.originalValue) {
    btn.value = btn.dataset.originalValue;
  }
  
  currentForm.querySelector('input:not([type="hidden"])')?.focus();
};

/**
 * Handles form submission via Fetch API.
 */
const onFormSubmit = async (e) => {
  if (e) e.preventDefault();
  if (!currentForm) return false;

  clearErrors();
  disableForm();

  const url = `${currentForm.getAttribute('action')}.json`;
  const formData = new FormData(currentForm);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-Token': decodeURIComponent(window._token || ''),
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    handleResponse(data);
  } catch (error) {
    console.error('Form submission error:', error);
    window.displayErrorMessage('An unexpected error occurred, please try again.', 'Error');
    enableForm();
    failureCallback(error);
  }

  return false;
};

/**
 * Processes the server response after form submission.
 */
const handleResponse = (data) => {
  if (data.success) {
    let message = 'Successfully created!';
    if (data.count) {
      message = data.count === 1 ? 'One record successfully created!' : `${data.count} records created!`;
    }
    window.displayNewNotification(message, 'success');
    enableForm();
    successCallback(data);
  } else {
    if (data.error_message) {
      displayValidationErrors(data.error_message);
    }
    window.displayNewNotification('Your form contains some errors, please try again.', 'error');
    enableForm();
  }
};

/**
 * Displays validation errors for multiple fields.
 */
const displayValidationErrors = (errors) => {
  for (const field in errors) {
    displayValidationError(field, errors[field]);
  }
};

/**
 * Displays validation errors for a specific field.
 */
const displayValidationError = (field, errors) => {
  const fieldId = `${getObjectName()}_${field}`;
  const element = document.getElementById(fieldId);
  if (element) {
    const container = getOrCreateErrorContainer(element);
    container.textContent = errors.join(', ');
  }
};

/**
 * Finds or creates an error message container for a field.
 */
const getOrCreateErrorContainer = (field) => {
  let container = field.parentElement.querySelector('.field_error');
  if (!container) {
    container = document.createElement('div');
    container.className = 'field_error';
    field.parentElement.appendChild(container);
  }
  return container;
};

/**
 * Clears all validation error messages in the current form.
 */
const clearErrors = () => {
  if (!currentForm) return;
  currentForm.querySelectorAll('.field_error').forEach(el => el.textContent = '');
};

/**
 * Global entry point to initialize a WulinForm.
 */
window.initializeWulinForm = (formElement, onProxySuccess, onProxyFailure) => {
  currentForm = formElement;
  
  if (onProxySuccess) successCallback = onProxySuccess;
  if (onProxyFailure) failureCallback = onProxyFailure;
  
  if (currentForm) {
    currentForm.onsubmit = onFormSubmit;
  }
};

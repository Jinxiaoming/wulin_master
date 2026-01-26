// Dialog system using Stimulus bridge
window.displayErrorMessage = (message, title) => {
  if (message === undefined) {
    message = 'An unexpected error occured.';
  }
  const escapedHtml = typeof escapeHtml === 'function' ? escapeHtml(message) : message;
  const finalMessage = typeof simpleFormat === 'function' ? simpleFormat(escapedHtml) : escapedHtml;

  const modalElement = document.getElementById('error-modal');
  if (modalElement) {
    const event = new CustomEvent("open-modal", {
      detail: { message: finalMessage, title: title }
    });
    const controller = window.Stimulus.getControllerForElementAndIdentifier(modalElement, "modal");
    if (controller) {
      controller.open(event);
    }
  } else {
    alert(title + ": " + message);
  }
};

window.displayCustomizedConfirmModal = (params) => {
  const {
    message = 'Are you sure to do this ?',
    title = 'Confirmation',
    confirmCallBack,
  } = params;

  const modalElement = document.getElementById('confirm-modal');
  if (modalElement) {
    const event = new CustomEvent("open-modal", {
      detail: { message: message, title: title, confirmCallBack: confirmCallBack }
    });
    const controller = window.Stimulus.getControllerForElementAndIdentifier(modalElement, "modal");
    if (controller) {
      controller.open(event);
    }
  } else {
    if (confirm(message)) {
      confirmCallBack && confirmCallBack();
    }
  }
};

// Dialog system using Stimulus bridge
export const displayErrorMessage = (message?: string, title?: string): void => {
  if (message === undefined) {
    message = 'An unexpected error occured.';
  }
  const win = window as any;
  const escapedHtml = typeof win.escapeHtml === 'function' ? win.escapeHtml(message) : message;
  const finalMessage = typeof win.simpleFormat === 'function' ? win.simpleFormat(escapedHtml) : escapedHtml;

  const modalElement = document.getElementById('error-modal');
  if (modalElement) {
    const event = new CustomEvent("open-modal", {
      detail: { message: finalMessage, title: title }
    });
    const controller = win.Stimulus.getControllerForElementAndIdentifier(modalElement, "modal");
    if (controller) {
      controller.open(event);
    }
  } else {
    alert((title ? title + ": " : "") + message);
  }
};

export const displayCustomizedConfirmModal = (params: { message?: string, title?: string, confirmCallBack?: Function }): void => {
  const {
    message = 'Are you sure to do this ?',
    title = 'Confirmation',
    confirmCallBack,
  } = params;

  const win = window as any;
  const modalElement = document.getElementById('confirm-modal');
  if (modalElement) {
    const event = new CustomEvent("open-modal", {
      detail: { message: message, title: title, confirmCallBack: confirmCallBack }
    });
    const controller = win.Stimulus.getControllerForElementAndIdentifier(modalElement, "modal");
    if (controller) {
      controller.open(event);
    }
  } else {
    if (confirm(message)) {
      confirmCallBack && confirmCallBack();
    }
  }
};

// Global exposure for legacy
const win = window as any;
win.displayErrorMessage = displayErrorMessage;
win.displayCustomizedConfirmModal = displayCustomizedConfirmModal;

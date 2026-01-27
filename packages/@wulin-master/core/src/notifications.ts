// Notification system using Stimulus bridge
export const displayNewNotification = (message: string, type?: string, always?: boolean): boolean => {
  // Dispatch event to Stimulus controller
  const event = new CustomEvent("display-notification", {
    detail: { message, type, always }
  });
  
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.dataset.controller = "notification";
    container.dataset.notificationTarget = "container";
    container.addEventListener("display-notification", (e) => {
      const win = window as any;
      const controller = win.Stimulus.getControllerForElementAndIdentifier(container, "notification");
      if (controller) {
        controller.display(e);
      }
    });
    document.body.appendChild(container);
  }
  
  container.dispatchEvent(event);
  return true;
};

// Backward compatibility for saveMessage
export const saveMessage = (message: string, type?: string): void => {
  const win = window as any;
  // We can just call the method on the controller if it exists
  const container = document.getElementById('notification-container');
  if (container) {
    const controller = win.Stimulus.getControllerForElementAndIdentifier(container, "notification");
    if (controller) {
      controller.saveMessage(message, type);
    }
  }
};

// Global exposure for legacy
const win = window as any;
win.displayNewNotification = displayNewNotification;
win.saveMessage = saveMessage;

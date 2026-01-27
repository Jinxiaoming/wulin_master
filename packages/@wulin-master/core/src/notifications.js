// Notification system using Stimulus bridge
window.displayNewNotification = (message, type, always) => {
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
      const controller = window.Stimulus.getControllerForElementAndIdentifier(container, "notification");
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
window.saveMessage = (message, type) => {
  const event = new CustomEvent("save-message-only", {
    detail: { message, type }
  });
  // We can just call the method on the controller if it exists
  const container = document.getElementById('notification-container');
  if (container) {
    const controller = window.Stimulus.getControllerForElementAndIdentifier(container, "notification");
    if (controller) {
      controller.saveMessage(message, type);
    }
  }
};

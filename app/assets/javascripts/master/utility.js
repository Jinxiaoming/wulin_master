/**
 * Utility functions for WulinMaster.
 * Modernized to use native JS and remove jQuery dependencies.
 */

/**
 * Formats a number with locale-aware delimiters.
 */
const formatNum = (number) => new Intl.NumberFormat().format(number);

/**
 * Parses a date and time string into a Date object.
 * @param {string} date - Date in 'dd/mm/yyyy' format
 * @param {string} time - Time in 'hh:mm:ss' format
 */
const formatDate = (date, time) => {
  const dayMonthYear = date.replace(/^(\d{1,2}\/)(\d{1,2}\/)(\d{4})$/, '$2$1$3');
  const finalDate = `${dayMonthYear} ${time}`;
  return new Date(finalDate);
};

/**
 * Positions a Flatpickr calendar inside a modal, ensuring it's visible.
 */
const positionCalendar = (self) => {
  const position = self.element.getBoundingClientRect();
  const calendarHeight = self.calendarContainer.offsetHeight;
  let top = position.top + position.height + window.pageYOffset;
  let left = position.left + window.pageXOffset;

  // Verify if viewport bottom space is enough to contain calendar
  if (window.innerHeight - position.bottom < calendarHeight) {
    top = position.top + window.pageYOffset - calendarHeight;
  }

  self.calendarContainer.style.top = `${top}px`;
  self.calendarContainer.style.left = `${left}px`;

  // Don't allow popup to scroll
  const modalContent = self.element.closest('.modal-content');
  if (modalContent) {
    modalContent.style.overflow = 'hidden';
  }
};

/**
 * Restores scrolling on the modal content when the calendar is closed.
 */
const modalScroll = (instance) => {
  const modalContent = instance.element.closest('.modal-content');
  if (modalContent) {
    modalContent.style.overflow = '';
  }
};

const onCalendarOpenClose = {
  onOpen: [repositionOnOpen],
  onClose: [reenableScroll],
};

function repositionOnOpen(selectedDates, dateStr, instance) {
  positionCalendar(instance);
  // Use a named function to allow removal if needed
  const onResize = () => positionCalendar(instance);
  window.addEventListener('resize', onResize);
  // Note: We might need a way to remove this listener on close
}

function reenableScroll(selectedDates, dateStr, instance) {
  modalScroll(instance);
}

// Export to window for global access
Object.assign(window, {
  formatNum,
  formatDate,
  positionCalendar,
  modalScroll,
  onCalendarOpenClose
});

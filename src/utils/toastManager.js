// Toast Notification Manager

let toastCallback = null;

export const setToastCallback = (callback) => {
  toastCallback = callback;
};

export const showToast = (message, type = 'info') => {
  if (toastCallback) {
    toastCallback(message, type);
  } else {
    console.log(`[Toast ${type}]:`, message);
  }
};

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  warning: (message) => showToast(message, 'warning'),
  info: (message) => showToast(message, 'info')
};

export default toast;

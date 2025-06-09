const isDev = process.env.NODE_ENV === "development";

export const debugLog = (message: string, data?: any) => {
  if (isDev) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

export const debugError = (message: string, error?: any) => {
  if (isDev) {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
};
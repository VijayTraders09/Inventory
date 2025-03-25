export const isValidMobileNumber = (mobile) => {
    const regex = /^[6-9]\d{9}$/; // Indian mobile number validation (starts with 6-9, 10 digits)
    return regex.test(mobile);
  };
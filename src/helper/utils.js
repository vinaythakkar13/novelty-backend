export const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let password = "";
  
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return password;
  };
  
  export const generateStaffId = () => {
    const digits = Math.floor(100000 + Math.random() * 900000); // creates 6-digit number
    return `STF${digits}`;
  };
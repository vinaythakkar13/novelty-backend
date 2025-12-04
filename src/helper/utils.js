export const generatePassword = () => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+";

  // Ensure required characters
  let passwordArray = [
    uppercase.charAt(Math.floor(Math.random() * uppercase.length)),
    numbers.charAt(Math.floor(Math.random() * numbers.length)),
    special.charAt(Math.floor(Math.random() * special.length))
  ];

  // Fill remaining 5 characters with alphabets only
  const alphabets = uppercase + lowercase;
  for (let i = 0; i < 5; i++) {
    passwordArray.push(
      alphabets.charAt(Math.floor(Math.random() * alphabets.length))
    );
  }

  // Shuffle the final array for randomness
  passwordArray = passwordArray.sort(() => Math.random() - 0.5);

  return passwordArray.join("");
};

export const generateStaffId = () => {
  const digits = Math.floor(100000 + Math.random() * 900000); // creates 6-digit number
  return `STF${digits}`;
};
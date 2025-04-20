
// This is a comprehensive test to verify that the pagination comparison works correctly
console.log('Testing pagination with different types:');

// Test with numbers
const test1 = {
  currentPage: 2,
  totalPages: 158,
  result: 2 >= 158
};
console.log('Test with numbers:', test1);

// Test with strings that should be numbers
const test2 = {
  currentPage: "2",
  totalPages: "158",
  result: "2" >= "158"
};
console.log('Test with strings:', test2);

// Test with explicit conversion
const test3 = {
  currentPage: "2",
  totalPages: "158",
  result: Number("2") >= Number("158")
};
console.log('Test with explicit conversion:', test3);

// Expected output should show that string comparison might not work as expected
// but Number conversion should work correctly

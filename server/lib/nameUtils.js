/**
 * Capitalizes the first letter of each word in a name
 * Example: "john doe" -> "John Doe", "MARY JANE SMITH" -> "Mary Jane Smith"
 * @param {string} name - The name to capitalize
 * @returns {string} - The capitalized name
 */
function capitalizeName(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalizes customer name in a customer object
 * @param {Object} customer - Customer object
 * @returns {Object} - Customer object with capitalized name
 */
function capitalizeCustomerName(customer) {
  if (!customer) return customer;
  
  if (customer.name) {
    customer.name = capitalizeName(customer.name);
  }
  
  return customer;
}

/**
 * Capitalizes customer names in an array of customers
 * @param {Array} customers - Array of customer objects
 * @returns {Array} - Array of customer objects with capitalized names
 */
function capitalizeCustomerNames(customers) {
  if (!Array.isArray(customers)) return customers;
  
  return customers.map(customer => capitalizeCustomerName(customer));
}

module.exports = {
  capitalizeName,
  capitalizeCustomerName,
  capitalizeCustomerNames
};


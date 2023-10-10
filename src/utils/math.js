// Javascript program to add 2 fractions
   
// Function to return gcd of a and b
 
const gcd = (a, b) => {
    if (a == 0)
        return b;
    return gcd(b % a, a);
}
 
// Function to convert the 
// obtained fraction into 
// it's simplest form
 
const lowest = (den3, num3) => {
    // Finding gcd of both terms
    let common_factor = gcd(num3, den3);
   
    // Converting both terms  
    // into simpler terms by 
    // dividing them by common factor 
       
    den3 = parseInt(den3 / common_factor);
    num3 = parseInt(num3 / common_factor);
   
    return [den3, num3];
}
 
 
// Function to add two fractions
export const addFraction = (num1, den1, num2, den2) => {
    // Finding gcd of den1 and den2
    let den3 = gcd(den1, den2);
   
    // Denominator of final 
    // fraction obtained finding 
    // LCM of den1 and den2
    // LCM * GCD = a * b 
    den3 = (den1 * den2) / den3;
   
    // Changing the fractions to 
    // have same denominator Numerator
    // of the final fraction obtained
    let num3 = ((num1) * (den3 / den1) +
            (num2) * (den3 / den2));
   
    // Calling function to convert 
    // final fraction into it's 
    // simplest form
    return lowest(num3, den3);
}
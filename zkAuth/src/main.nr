// Import the Poseidon hash function from Noir's standard library
use dep::std::hash::poseidon;

// Define the main function with public return type
fn main(password: Field, hash_password: Field) -> pub bool {
    // Compute the hash of the input password using Poseidon
    let computed_hash = std::hash::poseidon::bn254::hash_1([password]);

    // Ensure the computed hash matches the provided hash_password
    let is_valid = computed_hash == hash_password;

    is_valid
}

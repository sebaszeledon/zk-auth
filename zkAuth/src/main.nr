// Importe la función hash Poseidon de la biblioteca estándar de Noir
use dep::std::hash::poseidon;

// Definir la función principal con tipo de retorno público
fn main(password: Field, hash_password: Field) -> pub bool {
    // Calcule el hash de la contraseña ingresada usando Poseidon
    let computed_hash = std::hash::poseidon::bn254::hash_1([password]);

    // Asegúrese de que el hash calculado coincida con la contraseña hash proporcionada
    let is_valid = computed_hash == hash_password;

    is_valid
}

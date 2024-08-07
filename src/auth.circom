pragma circom 2.0.0;

template Authentication(pub_input hash_password) {
    signal input password;
    signal output is_valid;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== password;
    is_valid <== (hasher.out == hash_password);
}

component main = Authentication();
package com.example.ecommerce.exception;

public class InvalidPassword extends RuntimeException {

    public InvalidPassword(String passError) {
        super("Invalid password: " + passError);
    }
}

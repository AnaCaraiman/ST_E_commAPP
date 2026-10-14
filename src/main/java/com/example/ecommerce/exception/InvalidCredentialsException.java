package com.example.ecommerce.exception;

public class InvalidCredentialsException extends RuntimeException {


    public InvalidCredentialsException() {
        super("Invalid credentials");
    }

    public String getMessage() {
        return super.getMessage();
    }
}

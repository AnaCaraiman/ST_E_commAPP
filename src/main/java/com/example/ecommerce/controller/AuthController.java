package com.example.ecommerce.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.ecommerce.dto.UserCreateDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.dto.UserLoginDTO;
import com.example.ecommerce.service.UserService;

@RestController
@RequestMapping("/auth")
@Tag(name = "Auth", description = "Sign up and login")
public class AuthController {

    @Autowired
    private UserService userService;

    @Operation(summary = "Create a new account: 201 + user, 400 invalid data, 409 username or email taken")
    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signup(@RequestBody UserCreateDTO userDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(userDTO));
    }

    @Operation(summary = "Login with username (or email) and password: 200 + user, 401 invalid credentials")
    @PostMapping("/login")
    public UserDTO login(@RequestBody UserLoginDTO userDTO) {
        return userService.login(userDTO);
    }
}

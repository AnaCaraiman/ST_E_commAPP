package com.example.ecommerce.service;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.ecommerce.data.UserEntity;
import com.example.ecommerce.data.UserRepository;
import com.example.ecommerce.dto.UserCreateDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.dto.UserLoginDTO;
import com.example.ecommerce.exception.ConflictException;
import com.example.ecommerce.exception.EntityNotFoundException;
import com.example.ecommerce.exception.InvalidCredentialsException;
import com.example.ecommerce.exception.InvalidEmail;
import com.example.ecommerce.exception.InvalidPassword;
import com.example.ecommerce.exception.ValidationException;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final int MIN_USERNAME_LENGTH = 3;
    private static final int MIN_PASSWORD_LENGTH = 6;

    @Autowired
    private UserRepository userRepository;

    public UserDTO getUserById(String id) throws EntityNotFoundException {
        UserEntity user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException(id));
        return toDTO(user);
    }

    public UserDTO getUserByUsername(String username) throws EntityNotFoundException {
        UserEntity user = userRepository.findByUsername(username);
        if (user == null) {
            throw new EntityNotFoundException(username);
        }
        return toDTO(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(UserService::toDTO).toList();
    }

    /**
     * Sign up: validates the input, rejects a duplicate username/email and stores the BCrypt-hashed password.
     */
    public UserDTO register(UserCreateDTO userDTO) {
        if (userDTO == null) {
            throw new ValidationException("Request body is required");
        }
        String username = userDTO.getUsername() == null ? "" : userDTO.getUsername().trim();
        String email = userDTO.getEmail() == null ? "" : userDTO.getEmail().trim().toLowerCase();

        if (username.length() < MIN_USERNAME_LENGTH) {
            throw new ValidationException("Username must be at least " + MIN_USERNAME_LENGTH + " characters long");
        }
        checkEmail(email);
        checkPassword(userDTO.getPassword());

        if (userRepository.findByUsername(username) != null) {
            throw new ConflictException("Username '" + username + "' is already taken");
        }
        if (userRepository.findByEmail(email) != null) {
            throw new ConflictException("An account with email '" + email + "' already exists");
        }

        UserEntity saved = userRepository.save(new UserEntity(username, userDTO.getPassword(), email));
        return toDTO(saved);
    }

    /**
     * Login with username or email + password. Returns the user so the front-end can keep its id.
     * An unknown user and a wrong password give the same error, so the API does not reveal which accounts exist.
     */
    public UserDTO login(UserLoginDTO userDTO) {
        if (userDTO == null || isBlank(userDTO.getUsername()) || isBlank(userDTO.getPassword())) {
            throw new ValidationException("Username and password are required");
        }
        String login = userDTO.getUsername().trim();
        UserEntity user = login.contains("@")
                ? userRepository.findByEmail(login.toLowerCase())
                : userRepository.findByUsername(login);

        if (user == null || !BCrypt.checkpw(userDTO.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }
        return toDTO(user);
    }

    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException(id);
        }
        userRepository.deleteById(id);
    }

    public void checkPassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new InvalidPassword("password must be at least " + MIN_PASSWORD_LENGTH + " characters long");
        }
        boolean hasLower = false;
        boolean hasUpper = false;
        boolean hasDigit = false;
        for (char c : password.toCharArray()) {
            if (Character.isLowerCase(c)) {
                hasLower = true;
            }
            if (Character.isUpperCase(c)) {
                hasUpper = true;
            }
            if (Character.isDigit(c)) {
                hasDigit = true;
            }
        }
        if (!hasLower) {
            throw new InvalidPassword("password must contain at least one lowercase letter");
        }
        if (!hasUpper) {
            throw new InvalidPassword("password must contain at least one uppercase letter");
        }
        if (!hasDigit) {
            throw new InvalidPassword("password must contain at least one digit");
        }
    }

    public void checkEmail(String email) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new InvalidEmail("email must look like name@domain.com");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static UserDTO toDTO(UserEntity user) {
        return new UserDTO(user.getId(), user.getUsername(), user.getEmail());
    }
}

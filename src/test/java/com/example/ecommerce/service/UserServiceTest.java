package com.example.ecommerce.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.example.ecommerce.data.UserEntity;
import com.example.ecommerce.data.UserRepository;
import com.example.ecommerce.dto.UserCreateDTO;
import com.example.ecommerce.dto.UserDTO;
import com.example.ecommerce.dto.UserLoginDTO;
import com.example.ecommerce.exception.ConflictException;
import com.example.ecommerce.exception.InvalidCredentialsException;
import com.example.ecommerce.exception.InvalidEmail;
import com.example.ecommerce.exception.InvalidPassword;
import com.example.ecommerce.exception.ValidationException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void register_validUser_savesHashedPasswordAndReturnsUser() {
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId("abc");
            return user;
        });

        UserDTO result = userService.register(new UserCreateDTO("  ana ", "Ana@Example.com", "Parola1"));

        assertEquals("abc", result.getId());
        assertEquals("ana", result.getUsername());
        assertEquals("ana@example.com", result.getEmail());
        verify(userRepository).save(argThat(user -> !user.getPassword().equals("Parola1")));
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        when(userRepository.findByUsername("ana")).thenReturn(new UserEntity("ana", "Parola1", "a@b.com"));

        assertThrows(ConflictException.class,
                () -> userService.register(new UserCreateDTO("ana", "other@example.com", "Parola1")));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.findByEmail("ana@example.com")).thenReturn(new UserEntity("x", "Parola1", "ana@example.com"));

        assertThrows(ConflictException.class,
                () -> userService.register(new UserCreateDTO("ana", "ana@example.com", "Parola1")));
    }

    @Test
    void register_shortUsername_throwsValidation() {
        assertThrows(ValidationException.class,
                () -> userService.register(new UserCreateDTO("ab", "ana@example.com", "Parola1")));
    }

    @Test
    void register_invalidEmail_throwsInvalidEmail() {
        assertThrows(InvalidEmail.class,
                () -> userService.register(new UserCreateDTO("ana", "ana.example.com", "Parola1")));
    }

    @Test
    void register_weakPassword_throwsInvalidPassword() {
        assertThrows(InvalidPassword.class,
                () -> userService.register(new UserCreateDTO("ana", "ana@example.com", "parola")));
    }

    @Test
    void checkPassword_rules() {
        assertThrows(InvalidPassword.class, () -> userService.checkPassword(null));
        assertThrows(InvalidPassword.class, () -> userService.checkPassword("Ab1"));
        assertThrows(InvalidPassword.class, () -> userService.checkPassword("ABCDEF1"));
        assertThrows(InvalidPassword.class, () -> userService.checkPassword("abcdef1"));
        assertThrows(InvalidPassword.class, () -> userService.checkPassword("Abcdefg"));
        assertDoesNotThrow(() -> userService.checkPassword("Abcdef1"));
    }

    @Test
    void login_withUsername_returnsUser() {
        UserEntity user = new UserEntity("ana", "Parola1", "ana@example.com");
        user.setId("abc");
        when(userRepository.findByUsername("ana")).thenReturn(user);

        UserDTO result = userService.login(new UserLoginDTO("ana", "Parola1"));

        assertEquals("abc", result.getId());
    }

    @Test
    void login_withEmail_returnsUser() {
        UserEntity user = new UserEntity("ana", "Parola1", "ana@example.com");
        when(userRepository.findByEmail("ana@example.com")).thenReturn(user);

        assertEquals("ana", userService.login(new UserLoginDTO("Ana@Example.com", "Parola1")).getUsername());
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        when(userRepository.findByUsername("ana")).thenReturn(new UserEntity("ana", "Parola1", "ana@example.com"));

        assertThrows(InvalidCredentialsException.class, () -> userService.login(new UserLoginDTO("ana", "Gresit1")));
    }

    @Test
    void login_unknownUser_throwsInvalidCredentials() {
        assertThrows(InvalidCredentialsException.class, () -> userService.login(new UserLoginDTO("nobody", "Parola1")));
    }

    @Test
    void login_missingFields_throwsValidation() {
        assertThrows(ValidationException.class, () -> userService.login(new UserLoginDTO("ana", "")));
        assertThrows(ValidationException.class, () -> userService.login(null));
    }
}

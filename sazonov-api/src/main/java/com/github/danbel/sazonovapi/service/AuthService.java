package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.domain.Role;
import com.github.danbel.sazonovapi.dto.AuthRegisterRequest;
import com.github.danbel.sazonovapi.dto.ProfileUpdateRequest;
import com.github.danbel.sazonovapi.dto.UserCreateRequest;
import com.github.danbel.sazonovapi.dto.UserUpdateRequest;
import com.github.danbel.sazonovapi.repository.AppUserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUser registerApplicant(AuthRegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Пользователь с таким логином уже существует");
        }
        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setRole(Role.APPLICANT);
        return userRepository.save(user);
    }

    public AppUser createUser(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Пользователь с таким логином уже существует");
        }
        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setRole(request.role());
        if (request.active() != null) {
            user.setActive(request.active());
        }
        return userRepository.save(user);
    }

    public AppUser updateProfile(Long userId, ProfileUpdateRequest request) {
        AppUser user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        return userRepository.save(user);
    }

    public AppUser updateUser(Long userId, UserUpdateRequest request) {
        AppUser user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.email() != null) {
            user.setEmail(request.email());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.active() != null) {
            user.setActive(request.active());
        }
        if (request.role() != null) {
            user.setRole(request.role());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return userRepository.save(user);
    }

    public List<AppUser> listUsers() {
        return userRepository.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .toList();
    }

    public AppUser getByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }
}

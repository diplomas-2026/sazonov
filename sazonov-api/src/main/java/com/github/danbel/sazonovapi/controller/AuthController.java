package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.dto.AuthLoginResponse;
import com.github.danbel.sazonovapi.dto.AuthRegisterRequest;
import com.github.danbel.sazonovapi.dto.ProfileUpdateRequest;
import com.github.danbel.sazonovapi.dto.UserResponse;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody AuthRegisterRequest request) {
        AppUser user = authService.registerApplicant(request);
        return ApiMapper.userResponse(user);
    }

    @PostMapping("/login")
    public AuthLoginResponse login(Authentication authentication) {
        return current(authentication);
    }

    @GetMapping("/me")
    public AuthLoginResponse me(Authentication authentication) {
        return current(authentication);
    }

    @PutMapping("/me")
    public UserResponse updateProfile(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        AppUser current = authService.getByUsername(authentication.getName());
        return ApiMapper.userResponse(authService.updateProfile(current.getId(), request));
    }

    private AuthLoginResponse current(Authentication authentication) {
        AppUser current = authService.getByUsername(authentication.getName());
        return new AuthLoginResponse(ApiMapper.userResponse(current), "Basic", java.util.List.of(current.getRole()));
    }
}

package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.dto.AuthLoginResponse;
import com.github.danbel.sazonovapi.dto.AuthLoginRequest;
import com.github.danbel.sazonovapi.dto.AuthRegisterRequest;
import com.github.danbel.sazonovapi.dto.ProfileUpdateRequest;
import com.github.danbel.sazonovapi.dto.UserResponse;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.AuthService;
import com.github.danbel.sazonovapi.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody AuthRegisterRequest request) {
        AppUser user = authService.registerApplicant(request);
        return ApiMapper.userResponse(user);
    }

    @PostMapping("/login")
    public AuthLoginResponse login(@Valid @RequestBody AuthLoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        return current(authentication.getName());
    }

    @GetMapping("/me")
    public AuthLoginResponse me(Authentication authentication) {
        return current(authentication.getName());
    }

    @PutMapping("/me")
    public UserResponse updateProfile(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        AppUser current = authService.getByUsername(authentication.getName());
        return ApiMapper.userResponse(authService.updateProfile(current.getId(), request));
    }

    private AuthLoginResponse current(String username) {
        AppUser current = authService.getByUsername(username);
        String token = jwtService.generateToken(current);
        return new AuthLoginResponse(token, "Bearer", ApiMapper.userResponse(current), java.util.List.of(current.getRole()));
    }
}

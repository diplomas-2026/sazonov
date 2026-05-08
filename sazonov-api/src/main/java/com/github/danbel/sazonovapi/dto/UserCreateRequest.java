package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
    @NotBlank String fullName,
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Size(min = 6, max = 100) String password,
    @NotBlank @Email String email,
    @NotBlank String phone,
    @NotNull Role role,
    Boolean active
) {
}

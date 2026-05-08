package com.github.danbel.sazonovapi.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
    @NotBlank String fullName,
    @NotBlank @Email String email,
    @NotBlank String phone
) {
}

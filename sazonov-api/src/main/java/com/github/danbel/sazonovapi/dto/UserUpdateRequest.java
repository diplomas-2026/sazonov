package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.Role;

public record UserUpdateRequest(
    String fullName,
    String email,
    String phone,
    Boolean active,
    Role role,
    String password
) {
}

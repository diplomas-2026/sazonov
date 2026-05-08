package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.Role;
import java.time.Instant;

public record UserResponse(
    Long id,
    String fullName,
    String username,
    String email,
    String phone,
    Role role,
    boolean active,
    Instant createdAt
) {
}

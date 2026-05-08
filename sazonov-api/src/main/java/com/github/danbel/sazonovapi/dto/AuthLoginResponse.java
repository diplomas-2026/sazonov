package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.Role;
import java.util.List;

public record AuthLoginResponse(
    String token,
    String tokenType,
    UserResponse user,
    List<Role> roles
) {
}

package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.Role;
import java.util.List;

public record AuthLoginResponse(
    UserResponse user,
    String tokenType,
    List<Role> roles
) {
}

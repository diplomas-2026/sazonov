package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.dto.DashboardResponse;
import com.github.danbel.sazonovapi.dto.SpecialityResponse;
import com.github.danbel.sazonovapi.dto.SpecialityUpsertRequest;
import com.github.danbel.sazonovapi.dto.UserCreateRequest;
import com.github.danbel.sazonovapi.dto.UserResponse;
import com.github.danbel.sazonovapi.dto.UserUpdateRequest;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.AuthService;
import com.github.danbel.sazonovapi.service.DashboardService;
import com.github.danbel.sazonovapi.service.SpecialityService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final SpecialityService specialityService;
    private final AuthService authService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return dashboardService.getDashboard();
    }

    @GetMapping("/specialities")
    public List<SpecialityResponse> specialities() {
        return specialityService.list().stream().map(ApiMapper::specialityResponse).toList();
    }

    @PostMapping("/specialities")
    public SpecialityResponse createSpeciality(@Valid @RequestBody SpecialityUpsertRequest request) {
        return ApiMapper.specialityResponse(specialityService.create(request));
    }

    @PutMapping("/specialities/{id}")
    public SpecialityResponse updateSpeciality(@PathVariable Long id, @Valid @RequestBody SpecialityUpsertRequest request) {
        return ApiMapper.specialityResponse(specialityService.update(id, request));
    }

    @DeleteMapping("/specialities/{id}")
    public void deleteSpeciality(@PathVariable Long id) {
        specialityService.delete(id);
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return authService.listUsers().stream().map(ApiMapper::userResponse).toList();
    }

    @PostMapping("/users")
    public UserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        AppUser user = authService.createUser(request);
        return ApiMapper.userResponse(user);
    }

    @PutMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        return ApiMapper.userResponse(authService.updateUser(id, request));
    }
}

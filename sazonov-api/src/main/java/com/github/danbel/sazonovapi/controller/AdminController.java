package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.dto.DashboardResponse;
import com.github.danbel.sazonovapi.dto.DepartmentResponse;
import com.github.danbel.sazonovapi.dto.DepartmentUpsertRequest;
import com.github.danbel.sazonovapi.dto.SpecialityResponse;
import com.github.danbel.sazonovapi.dto.SpecialityUpsertRequest;
import com.github.danbel.sazonovapi.dto.UserCreateRequest;
import com.github.danbel.sazonovapi.dto.UserResponse;
import com.github.danbel.sazonovapi.dto.UserUpdateRequest;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.AuthService;
import com.github.danbel.sazonovapi.service.DashboardService;
import com.github.danbel.sazonovapi.service.DepartmentService;
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
    private final DepartmentService departmentService;
    private final AuthService authService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return dashboardService.getDashboard();
    }

    @GetMapping("/departments")
    public List<DepartmentResponse> departments() {
        return departmentService.list().stream().map(ApiMapper::departmentResponse).toList();
    }

    @PostMapping("/departments")
    public DepartmentResponse createDepartment(@Valid @RequestBody DepartmentUpsertRequest request) {
        return ApiMapper.departmentResponse(departmentService.create(request));
    }

    @PutMapping("/departments/{id}")
    public DepartmentResponse updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentUpsertRequest request) {
        return ApiMapper.departmentResponse(departmentService.update(id, request));
    }

    @DeleteMapping("/departments/{id}")
    public void deleteDepartment(@PathVariable Long id) {
        departmentService.delete(id);
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

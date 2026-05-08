package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.dto.DashboardResponse;
import com.github.danbel.sazonovapi.dto.DepartmentResponse;
import com.github.danbel.sazonovapi.dto.SpecialityResponse;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.DashboardService;
import com.github.danbel.sazonovapi.service.DepartmentService;
import com.github.danbel.sazonovapi.service.SpecialityService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/public")
public class PublicController {

    private final SpecialityService specialityService;
    private final DepartmentService departmentService;
    private final DashboardService dashboardService;

    @GetMapping("/departments")
    public List<DepartmentResponse> departments() {
        return departmentService.list().stream().map(ApiMapper::departmentResponse).toList();
    }

    @GetMapping("/specialities")
    public List<SpecialityResponse> specialities() {
        return specialityService.list().stream().map(ApiMapper::specialityResponse).toList();
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return dashboardService.getDashboard();
    }
}

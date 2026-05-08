package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.dto.ApplicationResponse;
import com.github.danbel.sazonovapi.dto.ApplicationStatusUpdateRequest;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/staff")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffController {

    private final ApplicationService applicationService;

    @GetMapping("/applications")
    public List<ApplicationResponse> list(@RequestParam(value = "status", required = false) com.github.danbel.sazonovapi.domain.ApplicationStatus status) {
        return applicationService.listForStaff(Optional.ofNullable(status)).stream()
            .map(ApiMapper::applicationResponse)
            .toList();
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicationResponse updateStatus(@PathVariable Long id, @Valid @RequestBody ApplicationStatusUpdateRequest request) {
        AdmissionApplication application = applicationService.updateStatus(id, request);
        return ApiMapper.applicationResponse(application);
    }

    @GetMapping("/applications/{id}")
    public ApplicationResponse one(Authentication authentication, @PathVariable Long id) {
        return ApiMapper.applicationResponse(applicationService.getApplication(authentication, id));
    }
}

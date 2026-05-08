package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.ApplicationStatus;
import com.github.danbel.sazonovapi.dto.DashboardResponse;
import com.github.danbel.sazonovapi.dto.SpecialityStatsResponse;
import com.github.danbel.sazonovapi.repository.AdmissionApplicationRepository;
import com.github.danbel.sazonovapi.repository.AppUserRepository;
import com.github.danbel.sazonovapi.repository.SpecialityRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppUserRepository userRepository;
    private final AdmissionApplicationRepository applicationRepository;
    private final SpecialityRepository specialityRepository;

    public DashboardResponse getDashboard() {
        List<SpecialityStatsResponse> specialityStats = specialityRepository.findAll().stream()
            .map(speciality -> ApiMapper.specialityStatsResponse(
                speciality,
                applicationRepository.findAll().stream()
                    .filter(application -> application.getSpeciality().getId().equals(speciality.getId()))
                    .count()
            ))
            .toList();

        return new DashboardResponse(
            userRepository.count(),
            userRepository.findAll().stream().filter(user -> user.getRole().name().equals("APPLICANT")).count(),
            applicationRepository.count(),
            applicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.UNDER_REVIEW).size(),
            applicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.MISSING_DOCS).size(),
            applicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.ACCEPTED).size(),
            applicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.REJECTED).size(),
            specialityStats
        );
    }
}

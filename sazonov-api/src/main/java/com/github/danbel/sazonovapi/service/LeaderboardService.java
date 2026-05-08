package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.domain.Speciality;
import com.github.danbel.sazonovapi.dto.LeaderboardEntryResponse;
import com.github.danbel.sazonovapi.dto.LeaderboardResponse;
import com.github.danbel.sazonovapi.dto.SpecialityLeaderboardResponse;
import com.github.danbel.sazonovapi.repository.AdmissionApplicationRepository;
import com.github.danbel.sazonovapi.repository.SpecialityRepository;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final SpecialityRepository specialityRepository;
    private final AdmissionApplicationRepository applicationRepository;

    public LeaderboardResponse getLeaderboard() {
        List<AdmissionApplication> applications = applicationRepository.findAll();
        List<SpecialityLeaderboardResponse> specialities = specialityRepository.findAll().stream()
            .sorted(Comparator.comparing(Speciality::getCode, String.CASE_INSENSITIVE_ORDER))
            .map(speciality -> {
                List<AdmissionApplication> specialityApplications = applications.stream()
                    .filter(application -> application.getSpeciality().getId().equals(speciality.getId()))
                    .sorted(Comparator
                        .comparing(AdmissionApplication::getPoints, Comparator.reverseOrder())
                        .thenComparing(AdmissionApplication::getCreatedAt)
                        .thenComparing(AdmissionApplication::getId))
                    .toList();

                List<LeaderboardEntryResponse> entries = specialityApplications.stream()
                    .map(application -> {
                        int rank = specialityApplications.indexOf(application) + 1;
                        return ApiMapper.leaderboardEntryResponse(
                            application,
                            rank,
                            speciality.getBudgetPlaces() != null && rank <= speciality.getBudgetPlaces()
                        );
                    })
                    .collect(Collectors.toList());

                return ApiMapper.specialityLeaderboardResponse(
                    speciality,
                    specialityApplications.size(),
                    entries
                );
            })
            .toList();

        return ApiMapper.leaderboardResponse(specialities);
    }
}

package com.github.danbel.sazonovapi.dto;

import java.util.List;

public record DashboardResponse(
    long totalUsers,
    long totalApplicants,
    long totalApplications,
    long underReview,
    long missingDocs,
    long accepted,
    long rejected,
    List<SpecialityStatsResponse> specialityStats
) {
}

package com.github.danbel.sazonovapi.dto;

import java.util.List;

public record SpecialityLeaderboardResponse(
    Long specialityId,
    String specialityCode,
    String specialityName,
    Long departmentId,
    String departmentCode,
    String departmentName,
    Integer budgetPlaces,
    long applications,
    List<LeaderboardEntryResponse> entries
) {
}

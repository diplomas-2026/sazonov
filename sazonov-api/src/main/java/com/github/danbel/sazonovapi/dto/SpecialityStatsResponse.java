package com.github.danbel.sazonovapi.dto;

public record SpecialityStatsResponse(
    Long specialityId,
    String specialityCode,
    String specialityName,
    Long departmentId,
    String departmentCode,
    String departmentName,
    long applications
) {
}

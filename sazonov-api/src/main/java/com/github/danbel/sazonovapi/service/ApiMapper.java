package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.domain.ApplicationDocument;
import com.github.danbel.sazonovapi.domain.Department;
import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.domain.Speciality;
import com.github.danbel.sazonovapi.dto.ApplicationDocumentResponse;
import com.github.danbel.sazonovapi.dto.ApplicationResponse;
import com.github.danbel.sazonovapi.dto.DepartmentResponse;
import com.github.danbel.sazonovapi.dto.SpecialityResponse;
import com.github.danbel.sazonovapi.dto.SpecialityStatsResponse;
import com.github.danbel.sazonovapi.dto.UserResponse;
import java.util.List;

public final class ApiMapper {

    private ApiMapper() {
    }

    public static UserResponse userResponse(AppUser user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getUsername(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt()
        );
    }

    public static SpecialityResponse specialityResponse(Speciality speciality) {
        return new SpecialityResponse(
            speciality.getId(),
            departmentResponse(speciality.getDepartment()),
            speciality.getCode(),
            speciality.getName(),
            speciality.getDescription(),
            speciality.getBudgetPlaces(),
            speciality.getPaidPlaces(),
            speciality.getAdmissionPlan(),
            speciality.getCreatedAt()
        );
    }

    public static DepartmentResponse departmentResponse(Department department) {
        return new DepartmentResponse(
            department.getId(),
            department.getCode(),
            department.getName(),
            department.getDescription(),
            department.getCreatedAt()
        );
    }

    public static ApplicationDocumentResponse documentResponse(ApplicationDocument document) {
        return new ApplicationDocumentResponse(
            document.getId(),
            document.getType(),
            document.getFileName(),
            document.getContentType(),
            document.getSize(),
            document.getUploadedAt()
        );
    }

    public static ApplicationResponse applicationResponse(AdmissionApplication application) {
        List<ApplicationDocumentResponse> documents = application.getDocuments()
            .stream()
            .map(ApiMapper::documentResponse)
            .toList();

        return new ApplicationResponse(
            application.getId(),
            userResponse(application.getApplicant()),
            specialityResponse(application.getSpeciality()),
            application.getStatus(),
            application.getPassportSeries(),
            application.getPassportNumber(),
            application.getSnils(),
            application.getEducationDocumentNumber(),
            application.getGraduationSchool(),
            application.getGraduationYear(),
            application.getPoints(),
            application.getApplicantComment(),
            application.getStaffComment(),
            application.getCreatedAt(),
            application.getUpdatedAt(),
            documents
        );
    }

    public static SpecialityStatsResponse specialityStatsResponse(Speciality speciality, long applications) {
        return new SpecialityStatsResponse(
            speciality.getId(),
            speciality.getCode(),
            speciality.getName(),
            speciality.getDepartment().getId(),
            speciality.getDepartment().getCode(),
            speciality.getDepartment().getName(),
            applications
        );
    }
}

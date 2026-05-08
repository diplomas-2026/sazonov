package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.domain.ApplicationDocument;
import com.github.danbel.sazonovapi.domain.ApplicationStatus;
import com.github.danbel.sazonovapi.domain.AppUser;
import com.github.danbel.sazonovapi.domain.DocumentType;
import com.github.danbel.sazonovapi.domain.Role;
import com.github.danbel.sazonovapi.domain.Speciality;
import com.github.danbel.sazonovapi.dto.ApplicationCreateRequest;
import com.github.danbel.sazonovapi.dto.ApplicationUpdateRequest;
import com.github.danbel.sazonovapi.dto.ApplicationStatusUpdateRequest;
import com.github.danbel.sazonovapi.repository.AdmissionApplicationRepository;
import com.github.danbel.sazonovapi.repository.ApplicationDocumentRepository;
import com.github.danbel.sazonovapi.repository.AppUserRepository;
import com.github.danbel.sazonovapi.repository.SpecialityRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final AdmissionApplicationRepository applicationRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final AppUserRepository userRepository;
    private final SpecialityRepository specialityRepository;

    public AdmissionApplication createApplication(Authentication authentication, ApplicationCreateRequest request) {
        AppUser user = currentUser(authentication);
        Speciality speciality = specialityRepository.findById(request.specialityId())
            .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));

        AdmissionApplication application = new AdmissionApplication();
        application.setApplicant(user);
        application.setSpeciality(speciality);
        application.setPassportSeries(request.passportSeries().trim());
        application.setPassportNumber(request.passportNumber().trim());
        application.setSnils(request.snils().trim());
        application.setEducationDocumentNumber(request.educationDocumentNumber().trim());
        application.setGraduationSchool(request.graduationSchool().trim());
        application.setGraduationYear(request.graduationYear());
        application.setPoints(request.points());
        application.setApplicantComment(request.applicantComment());
        application.setStatus(ApplicationStatus.SUBMITTED);
        return applicationRepository.save(application);
    }

    public AdmissionApplication updateApplication(Authentication authentication, Long id, ApplicationUpdateRequest request) {
        AdmissionApplication application = applicationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        AppUser user = currentUser(authentication);
        if (!application.getApplicant().getUsername().equals(user.getUsername())) {
            throw new AccessDeniedException("Можно редактировать только свою заявку");
        }
        if (application.getStatus() == ApplicationStatus.ACCEPTED
            || application.getStatus() == ApplicationStatus.REJECTED
            || application.getStatus() == ApplicationStatus.CANCELLED) {
            throw new IllegalStateException("Эту заявку уже нельзя редактировать");
        }

        Speciality speciality = specialityRepository.findById(request.specialityId())
            .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));

        application.setSpeciality(speciality);
        application.setPassportSeries(request.passportSeries().trim());
        application.setPassportNumber(request.passportNumber().trim());
        application.setSnils(request.snils().trim());
        application.setEducationDocumentNumber(request.educationDocumentNumber().trim());
        application.setGraduationSchool(request.graduationSchool().trim());
        application.setGraduationYear(request.graduationYear());
        application.setPoints(request.points());
        application.setApplicantComment(request.applicantComment());
        application.touch();
        return applicationRepository.save(application);
    }

    public AdmissionApplication cancelApplication(Authentication authentication, Long id) {
        AdmissionApplication application = applicationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        AppUser user = currentUser(authentication);
        if (!application.getApplicant().getUsername().equals(user.getUsername())) {
            throw new AccessDeniedException("Можно отменить только свою заявку");
        }
        if (application.getStatus() == ApplicationStatus.CANCELLED) {
            throw new IllegalStateException("Заявка уже отменена");
        }
        if (application.getStatus() == ApplicationStatus.ACCEPTED || application.getStatus() == ApplicationStatus.REJECTED) {
            throw new IllegalStateException("Эту заявку нельзя отменить");
        }
        application.setStatus(ApplicationStatus.CANCELLED);
        application.touch();
        return applicationRepository.save(application);
    }

    public List<AdmissionApplication> listForCurrentUser(Authentication authentication) {
        AppUser user = currentUser(authentication);
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF) {
            return applicationRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
        }
        return applicationRepository.findByApplicantUsernameOrderByCreatedAtDesc(user.getUsername());
    }

    public List<AdmissionApplication> listForStaff(Optional<ApplicationStatus> status) {
        List<AdmissionApplication> all = status
            .map(applicationRepository::findByStatusOrderByCreatedAtDesc)
            .orElseGet(applicationRepository::findAll);
        return all.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .toList();
    }

    public AdmissionApplication getApplication(Authentication authentication, Long id) {
        AdmissionApplication application = applicationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        AppUser user = currentUser(authentication);
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF
            || application.getApplicant().getUsername().equals(user.getUsername())) {
            return application;
        }
        throw new AccessDeniedException("Нет доступа к заявке");
    }

    public AdmissionApplication updateStatus(Long id, ApplicationStatusUpdateRequest request) {
        AdmissionApplication application = applicationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        application.setStatus(request.status());
        application.setStaffComment(request.staffComment());
        application.touch();
        return applicationRepository.save(application);
    }

    public ApplicationDocument uploadDocument(Authentication authentication, Long applicationId, DocumentType type, MultipartFile file) {
        AdmissionApplication application = getApplication(authentication, applicationId);
        AppUser user = currentUser(authentication);
        if (!(user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF
            || application.getApplicant().getUsername().equals(user.getUsername()))) {
            throw new AccessDeniedException("Нет доступа к документу");
        }
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл пустой");
        }

        ApplicationDocument document = new ApplicationDocument();
        document.setApplication(application);
        document.setType(type);
        document.setFileName(file.getOriginalFilename() == null ? "document" : file.getOriginalFilename());
        document.setContentType(Optional.ofNullable(file.getContentType()).orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE));
        document.setSize(file.getSize());
        try {
            document.setData(file.getBytes());
        } catch (Exception ex) {
            throw new IllegalStateException("Не удалось считать файл", ex);
        }

        ApplicationDocument saved = documentRepository.save(document);
        application.getDocuments().add(saved);
        application.touch();
        applicationRepository.save(application);
        return saved;
    }

    public byte[] downloadDocument(Authentication authentication, Long documentId) {
        ApplicationDocument document = getDocument(authentication, documentId);
        return document.getData();
    }

    public ApplicationDocument getDocument(Authentication authentication, Long documentId) {
        ApplicationDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Документ не найден"));
        getApplication(authentication, document.getApplication().getId());
        return document;
    }

    public ApplicationDocument deleteDocument(Authentication authentication, Long documentId) {
        ApplicationDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Документ не найден"));
        AdmissionApplication application = getApplication(authentication, document.getApplication().getId());
        application.getDocuments().removeIf(existing -> existing.getId().equals(documentId));
        application.touch();
        documentRepository.delete(document);
        return document;
    }

    private AppUser currentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
            .filter(AppUser::isActive)
            .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }
}

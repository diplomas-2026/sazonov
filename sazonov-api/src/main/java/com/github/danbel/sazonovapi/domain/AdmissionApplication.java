package com.github.danbel.sazonovapi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "admission_applications")
public class AdmissionApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private AppUser applicant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "speciality_id", nullable = false)
    private Speciality speciality;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    @Column(nullable = false)
    private String passportSeries;

    @Column(nullable = false)
    private String passportNumber;

    @Column(nullable = false)
    private String snils;

    @Column(nullable = false)
    private String educationDocumentNumber;

    @Column(nullable = false)
    private String graduationSchool;

    @Column(nullable = false)
    private Integer graduationYear;

    @Column(nullable = false)
    private Integer points;

    @Column(length = 2000)
    private String applicantComment;

    @Column(length = 2000)
    private String staffComment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "application", orphanRemoval = true)
    private List<ApplicationDocument> documents = new ArrayList<>();

    public void touch() {
        this.updatedAt = Instant.now();
    }
}

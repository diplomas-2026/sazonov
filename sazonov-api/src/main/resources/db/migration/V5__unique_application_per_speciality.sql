CREATE UNIQUE INDEX IF NOT EXISTS ux_admission_applications_applicant_speciality
    ON admission_applications (applicant_id, speciality_id);
